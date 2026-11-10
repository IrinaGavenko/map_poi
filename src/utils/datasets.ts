import type {
  CategoriesDocument,
  CollapseDataset,
  CollapsePolygon,
  LatLng,
  Point,
} from '@type'
import { setCategoriesRegistry } from '@type/categories'
import { normalizeMarkers } from '@utils/normalizeMarker'
import {
  clampPinnedSize,
  DEFAULT_PINNED_SIZE,
  setPinnedSize,
} from '@utils/pinnedSize'

const modules = import.meta.glob('../data/*.json', {
  import: 'default',
}) as Record<string, () => Promise<unknown>>

function datasetIdFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.json$/i, '')
}

function isHiddenDatasetId(id: string): boolean {
  return (
    id.startsWith('_') ||
    id.startsWith('collapse-') ||
    id.startsWith('example_') ||
    id === 'categories' ||
    id.startsWith('categories_')
  )
}

const allLoadersById = Object.fromEntries(
  Object.entries(modules).map(([path, loader]) => [datasetIdFromPath(path), loader]),
) as Record<string, () => Promise<unknown>>

function isLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number'
}

function normalizePolygon(value: unknown): CollapsePolygon | null {
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

function isCategoriesDocument(value: unknown): value is CategoriesDocument {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.version !== 'number') return false
  const hasCategories = !!record.categories && typeof record.categories === 'object'
  const hasCategoryTypes = !!record.categoryTypes && typeof record.categoryTypes === 'object'
  return hasCategories || hasCategoryTypes
}

async function loadCategoriesRef(ref: unknown): Promise<CategoriesDocument | null> {
  if (isCategoriesDocument(ref)) return ref
  if (typeof ref !== 'string' || !ref.trim()) return null

  const base = ref
    .trim()
    .replace(/^\.\//, '')
    .replace(/\.json$/i, '')
    .split('/')
    .pop()

  if (!base) return null
  const loader = allLoadersById[base]
  if (!loader) return null
  const data = await loader()
  return isCategoriesDocument(data) ? data : null
}

const loadersById = Object.fromEntries(
  Object.entries(allLoadersById).filter(([id]) => !isHiddenDatasetId(id)),
) as Record<string, () => Promise<unknown>>

const eagerModules = import.meta.glob('../data/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

const eagerById = Object.fromEntries(
  Object.entries(eagerModules).map(([path, data]) => [datasetIdFromPath(path), data]),
) as Record<string, unknown>

function datasetTitleFromData(data: unknown, fallbackId: string): string {
  if (!data || typeof data !== 'object') return fallbackId
  const meta = (data as Record<string, unknown>).meta
  if (!meta || typeof meta !== 'object') return fallbackId
  const title = (meta as Record<string, unknown>).title
  if (typeof title === 'string' && title.trim()) return title.trim()
  return fallbackId
}

export const DATASET_IDS = Object.keys(loadersById).sort()

export type DatasetOption = {
  id: string
  title: string
}

/** Visible maps for the selector: id + `meta.title` (falls back to id). */
export const DATASET_OPTIONS: DatasetOption[] = DATASET_IDS.map((id) => ({
  id,
  title: datasetTitleFromData(eagerById[id], id),
}))

export const DEFAULT_DATASET_ID = DATASET_IDS.includes('miami')
  ? 'miami'
  : (DATASET_IDS[0] ?? 'miami')

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
    // ignore quota / private mode
  }
}

async function loadRaw(id: string): Promise<unknown> {
  const loader = allLoadersById[id]
  if (!loader) return null
  return loader()
}

async function ensureDefaultCategories(): Promise<CategoriesDocument | null> {
  return loadCategoriesRef('categories.json')
}

/** Accepts `{ polygon, points }` where points are Marker wrappers. */
export function normalizeCollapseDataset(data: unknown): CollapseDataset {
  if (Array.isArray(data)) {
    return { polygon: null, points: normalizeMarkers(data) }
  }

  if (!data || typeof data !== 'object') {
    return { polygon: null, points: [] }
  }

  const record = data as Record<string, unknown>
  return {
    polygon: normalizePolygon(record.polygon),
    points: normalizeMarkers(record.points),
  }
}

export type LoadedDataset = {
  points: Point[]
  categories: CategoriesDocument | null
}

export async function loadDataset(id: string): Promise<LoadedDataset> {
  const data = await loadRaw(resolveDatasetId(id))
  const fallbackCategories = await ensureDefaultCategories()

  if (Array.isArray(data)) {
    const categories = fallbackCategories
    setCategoriesRegistry(categories)
    setPinnedSize(DEFAULT_PINNED_SIZE)
    return { points: normalizeMarkers(data), categories }
  }

  if (!data || typeof data !== 'object') {
    setCategoriesRegistry(fallbackCategories)
    setPinnedSize(DEFAULT_PINNED_SIZE)
    return { points: [], categories: fallbackCategories }
  }

  const record = data as Record<string, unknown>
  const categories =
    (await loadCategoriesRef(record.categories)) ?? fallbackCategories
  setCategoriesRegistry(categories)
  setPinnedSize(clampPinnedSize(record.pinned_size))

  const points = normalizeMarkers(record.points)
  return { points, categories }
}

/**
 * Loads nested JSON referenced by `point.isNested` (e.g. "FF.json").
 * Prefers `collapse-FF.json`; also supports legacy `_FF.json` / bare id.
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
