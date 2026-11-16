import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import {
  MARKERS_FILE_NAME,
  parseMapDatasetJson,
  workingDatasetJsonString,
  type WorkingMapDataset,
} from './mapDataset'
import { parseJsonText } from './parse'

export type ImportPayload = {
  dataset: WorkingMapDataset
  markersSkipped: number
  message: string
}

export type ImportResult =
  | { ok: true; payload: ImportPayload }
  | { ok: false; error: string }

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadDatasetZip(
  working: WorkingMapDataset,
  filename = 'map-dataset.zip',
): void {
  const files: Record<string, Uint8Array> = {
    [MARKERS_FILE_NAME]: strToU8(workingDatasetJsonString(working)),
  }
  const zipped = zipSync(files, { level: 6 })
  triggerDownload(
    new Blob([zipped], { type: 'application/zip' }),
    filename.endsWith('.zip') ? filename : `${filename}.zip`,
  )
}

function fileBaseName(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/')
  return (parts[parts.length - 1] ?? path).toLowerCase()
}

function findZipEntry(
  entries: Record<string, Uint8Array>,
  wanted: string,
): Uint8Array | null {
  const wantedLower = wanted.toLowerCase()
  for (const [path, bytes] of Object.entries(entries)) {
    if (fileBaseName(path) === wantedLower) return bytes
  }
  return null
}

function importFromZipBytes(bytes: Uint8Array): ImportResult {
  let entries: Record<string, Uint8Array>
  try {
    entries = unzipSync(bytes)
  } catch {
    return { ok: false, error: 'Could not read zip file.' }
  }

  const datasetBytes = findZipEntry(entries, MARKERS_FILE_NAME)
  if (!datasetBytes) {
    return {
      ok: false,
      error: `Zip must contain ${MARKERS_FILE_NAME} with the full map (categories, markers; meta and collapses optional).`,
    }
  }

  const parsedText = parseJsonText(strFromU8(datasetBytes))
  if (parsedText.ok === false) {
    return { ok: false, error: `${MARKERS_FILE_NAME}: ${parsedText.error}` }
  }

  const parsed = parseMapDatasetJson(parsedText.data)
  if (parsed.ok === false) {
    return { ok: false, error: `${MARKERS_FILE_NAME}: ${parsed.error}` }
  }

  const nestCount = Object.keys(parsed.dataset.collapses).length
  const parts = [
    `${parsed.dataset.points.length} markers`,
    'categories',
    nestCount > 0 ? `${nestCount} nested zones` : null,
  ].filter(Boolean)

  const skipped =
    parsed.markersSkipped > 0
      ? ` (${parsed.markersSkipped} markers skipped)`
      : ''

  return {
    ok: true,
    payload: {
      dataset: parsed.dataset,
      markersSkipped: parsed.markersSkipped,
      message: `Loaded ${parts.join(', ')}${skipped}.`,
    },
  }
}

export async function readImportFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  if (name.endsWith('.json')) {
    return {
      ok: false,
      error: 'Load a .zip that contains markers.json (full map). Single JSON files are not supported.',
    }
  }

  if (name.endsWith('.zip') || file.type === 'application/zip' || file.type === '') {
    return importFromZipBytes(bytes)
  }

  return importFromZipBytes(bytes)
}
