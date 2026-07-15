import type { Point } from '@type'

const modules = import.meta.glob('../data/*.json', {
  import: 'default',
}) as Record<string, () => Promise<Point[]>>

function datasetIdFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.json$/i, '')
}

function isHiddenDatasetId(id: string): boolean {
  return id.startsWith('_') || id.startsWith('collapse-')
}

const allLoadersById = Object.fromEntries(
  Object.entries(modules).map(([path, loader]) => [datasetIdFromPath(path), loader]),
) as Record<string, () => Promise<Point[]>>

const loadersById = Object.fromEntries(
  Object.entries(allLoadersById).filter(([id]) => !isHiddenDatasetId(id)),
) as Record<string, () => Promise<Point[]>>

export const DATASET_IDS = Object.keys(loadersById).sort()

export const DEFAULT_DATASET_ID = DATASET_IDS.includes('points')
  ? 'points'
  : (DATASET_IDS[0] ?? 'points')

const STORAGE_KEY = 'miami-map-dataset'

export function resolveDatasetId(id: string | null | undefined): string {
  if (id && DATASET_IDS.includes(id)) return id
  return DEFAULT_DATASET_ID
}

export function getStoredDatasetId(): string {
  try {
    return resolveDatasetId(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_DATASET_ID
  }
}

export function setStoredDatasetId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, resolveDatasetId(id))
  } catch {
    // ToDo: handle error
  }
}

async function loadFromLoader(id: string): Promise<Point[]> {
  const loader = allLoadersById[id]
  if (!loader) return []
  const data = await loader()
  return data.map((point) => ({ ...point }))
}

export async function loadDataset(id: string): Promise<Point[]> {
  return loadFromLoader(resolveDatasetId(id))
}

/**
 * Loads nested JSON referenced by `point.isCollapsible` (e.g. "FF.json").
 * Prefers `collapse-FF.json` (GitHub Pages–safe); also supports legacy `_FF.json`.
 */
export async function loadCollapsePoints(fileName: string): Promise<Point[]> {
  const raw = fileName.trim()
  if (!raw) return []

  const base = raw.replace(/\.json$/i, '').replace(/^_/, '').replace(/^collapse-/, '')
  const candidates = [...new Set([`collapse-${base}`, `_${base}`, base])]

  for (const id of candidates) {
    if (!allLoadersById[id]) continue
    return loadFromLoader(id)
  }
  return []
}
