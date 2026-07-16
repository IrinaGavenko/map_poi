import type { CollapseDataset, CollapsePolygon, LatLng, Point } from '@type'

const modules = import.meta.glob('../data/*.json', {
  import: 'default',
}) as Record<string, () => Promise<unknown>>

function datasetIdFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.json$/i, '')
}

function isHiddenDatasetId(id: string): boolean {
  return id.startsWith('_') || id.startsWith('collapse-')
}

function isLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number'
}

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && isLatLng(candidate.coordinates)
}

function clonePoint(point: Point): Point {
  return {
    ...point,
    type: [...point.type],
    picture: [...point.picture],
    coordinates: { ...point.coordinates },
  }
}

function normalizePoints(data: unknown): Point[] {
  if (!Array.isArray(data)) return []
  return data.filter(isPoint).map(clonePoint)
}

function normalizePolygon(value: unknown): CollapsePolygon | null {
  // Legacy: bare LatLng[]
  if (Array.isArray(value)) {
    const coordinates = value.filter(isLatLng).map((c) => ({ lat: c.lat, lng: c.lng }))
    if (coordinates.length < 2) return null
    return { color: '#3b82f6', coordinates }
  }

  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const coordinates = Array.isArray(record.coordinates)
    ? record.coordinates.filter(isLatLng).map((c) => ({ lat: c.lat, lng: c.lng }))
    : []
  if (coordinates.length < 2) return null

  const color =
    typeof record.color === 'string' && record.color.trim()
      ? record.color.trim()
      : '#3b82f6'

  return { color, coordinates }
}

/** Accepts `{ polygon, points }` or legacy bare `Point[]`. */
export function normalizeCollapseDataset(data: unknown): CollapseDataset {
  if (Array.isArray(data)) {
    return { polygon: null, points: normalizePoints(data) }
  }

  if (!data || typeof data !== 'object') {
    return { polygon: null, points: [] }
  }

  const record = data as Record<string, unknown>
  return {
    polygon: normalizePolygon(record.polygon),
    points: normalizePoints(record.points),
  }
}

const allLoadersById = Object.fromEntries(
  Object.entries(modules).map(([path, loader]) => [datasetIdFromPath(path), loader]),
) as Record<string, () => Promise<unknown>>

const loadersById = Object.fromEntries(
  Object.entries(allLoadersById).filter(([id]) => !isHiddenDatasetId(id)),
) as Record<string, () => Promise<unknown>>

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

async function loadRaw(id: string): Promise<unknown> {
  const loader = allLoadersById[id]
  if (!loader) return null
  return loader()
}

export async function loadDataset(id: string): Promise<Point[]> {
  const data = await loadRaw(resolveDatasetId(id))
  return normalizePoints(data)
}

/**
 * Loads nested JSON referenced by `point.isCollapsible` (e.g. "FF.json").
 * Prefers `collapse-FF.json` (GitHub Pages–safe); also supports legacy `_FF.json`.
 * Format: `{ polygon: { color, coordinates }, points: Point[] }`. Legacy: bare `Point[]`.
 */
export async function loadCollapseDataset(fileName: string): Promise<CollapseDataset> {
  const raw = fileName.trim()
  if (!raw) return { polygon: null, points: [] }

  const base = raw.replace(/\.json$/i, '').replace(/^_/, '').replace(/^collapse-/, '')
  const candidates = [...new Set([`collapse-${base}`, `_${base}`, base])]

  for (const id of candidates) {
    if (!allLoadersById[id]) continue
    return normalizeCollapseDataset(await loadRaw(id))
  }
  return { polygon: null, points: [] }
}

/** @deprecated Prefer `loadCollapseDataset` — returns points only. */
export async function loadCollapsePoints(fileName: string): Promise<Point[]> {
  const dataset = await loadCollapseDataset(fileName)
  return dataset.points
}
