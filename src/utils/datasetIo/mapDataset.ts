import type {
  CategoriesDocument,
  CollapseDataset,
  CollapsePolygon,
  MapDatasetMeta,
  Marker,
  Point,
} from '@type'
import {
  clampPinnedSize,
  DEFAULT_PINNED_SIZE,
  type PinnedSize,
} from '@utils/pinnedSize'
import { normalizeCollapseDataset } from '@utils/datasets'
import { parseCategoriesJson, parseMarkersJson } from './parse'
import { serializeCategories, serializeMarkers } from './serialize'

export const MARKERS_FILE_NAME = 'markers.json'

export type SerializedCollapse = {
  polygon: CollapsePolygon | null
  points: Marker[]
}

/** On-disk / zip JSON shape (markers, not UI Points). */
export type SerializedMapDataset = {
  version: number
  meta?: MapDatasetMeta
  pinned_size?: PinnedSize
  categories: CategoriesDocument
  points: Marker[]
  collapses?: Record<string, SerializedCollapse>
}

export type WorkingMapDataset = {
  version: number
  meta: MapDatasetMeta
  pinnedSize: PinnedSize
  categories: CategoriesDocument
  points: Point[]
  collapses: Record<string, CollapseDataset>
}

export const EMPTY_CATEGORIES: CategoriesDocument = {
  version: 1,
  categoryTypes: {},
}

/** Default meta when the zip/dataset omits it. */
export function generateDefaultMeta(): MapDatasetMeta {
  const stamp = new Date().toISOString().slice(0, 10)
  return {
    id: `map-${stamp}`,
    title: 'Untitled map',
    description: '',
  }
}

function metaHasContent(meta: MapDatasetMeta): boolean {
  return Boolean(
    (meta.id && meta.id.trim()) ||
      (meta.title && meta.title.trim()) ||
      (meta.description && meta.description.trim()),
  )
}

export function emptyWorkingDataset(): WorkingMapDataset {
  return {
    version: 1,
    meta: generateDefaultMeta(),
    pinnedSize: DEFAULT_PINNED_SIZE,
    categories: EMPTY_CATEGORIES,
    points: [],
    collapses: {},
  }
}

export function serializeCollapse(collapse: CollapseDataset): SerializedCollapse {
  return {
    polygon: collapse.polygon
      ? {
          color: collapse.polygon.color,
          coordinates: collapse.polygon.coordinates.map((c) => ({
            lat: c.lat,
            lng: c.lng,
          })),
        }
      : null,
    points: serializeMarkers(collapse.points),
  }
}

export function serializeWorkingDataset(
  working: WorkingMapDataset,
): SerializedMapDataset {
  const collapses: Record<string, SerializedCollapse> = {}
  for (const [key, collapse] of Object.entries(working.collapses)) {
    collapses[key] = serializeCollapse(collapse)
  }

  const dataset: SerializedMapDataset = {
    version: working.version,
    pinned_size: working.pinnedSize,
    categories: working.categories,
    points: serializeMarkers(working.points),
  }

  // Omit meta when empty (loaders will generate defaults).
  if (metaHasContent(working.meta)) {
    dataset.meta = { ...working.meta }
  }

  // Omit collapses when there are no nested zones.
  if (Object.keys(collapses).length > 0) {
    dataset.collapses = collapses
  }

  return dataset
}

export type ParseMapDatasetResult =
  | { ok: true; dataset: WorkingMapDataset; markersSkipped: number }
  | { ok: false; error: string }

function parseMeta(value: unknown): MapDatasetMeta {
  if (value == null) return generateDefaultMeta()
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return generateDefaultMeta()
  }

  const record = value as Record<string, unknown>
  const meta: MapDatasetMeta = {}
  if (typeof record.id === 'string' && record.id.trim()) meta.id = record.id.trim()
  if (typeof record.title === 'string' && record.title.trim()) {
    meta.title = record.title.trim()
  }
  if (typeof record.description === 'string') {
    meta.description = record.description
  }

  if (!metaHasContent(meta)) return generateDefaultMeta()

  const defaults = generateDefaultMeta()
  if (!meta.id) meta.id = defaults.id
  if (!meta.title) meta.title = defaults.title
  return meta
}

function parseCollapses(
  value: unknown,
): { ok: true; collapses: Record<string, CollapseDataset> } | { ok: false; error: string } {
  if (value == null) return { ok: true, collapses: {} }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'collapses must be an object map of nested zones.' }
  }

  const collapses: Record<string, CollapseDataset> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    collapses[key] = normalizeCollapseDataset(raw)
  }
  return { ok: true, collapses }
}

export function parseMapDatasetJson(data: unknown): ParseMapDatasetResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'markers.json must be a map dataset object.' }
  }

  const record = data as Record<string, unknown>
  if (typeof record.version !== 'number') {
    return { ok: false, error: 'markers.json must include a numeric version.' }
  }

  const categoriesResult = parseCategoriesJson(record.categories)
  if (categoriesResult.ok === false) {
    return { ok: false, error: `categories: ${categoriesResult.error}` }
  }

  const markersResult = parseMarkersJson(record.points ?? [])
  if (markersResult.ok === false) {
    return { ok: false, error: `points: ${markersResult.error}` }
  }

  const collapsesResult = parseCollapses(record.collapses)
  if (collapsesResult.ok === false) {
    return collapsesResult
  }

  return {
    ok: true,
    markersSkipped: markersResult.skipped,
    dataset: {
      version: record.version,
      meta: parseMeta(record.meta),
      pinnedSize: clampPinnedSize(record.pinned_size),
      categories: categoriesResult.document,
      points: markersResult.points,
      collapses: collapsesResult.collapses,
    },
  }
}

/** Exact key match: `isNested` must equal a key in `collapses`. */
export function resolveCollapse(
  collapses: Record<string, CollapseDataset>,
  key: string,
): CollapseDataset {
  const raw = key.trim()
  if (!raw) return { polygon: null, points: [] }
  return collapses[raw] ?? { polygon: null, points: [] }
}

export function workingDatasetJsonString(working: WorkingMapDataset): string {
  return `${JSON.stringify(serializeWorkingDataset(working), null, 2)}\n`
}

/** Build categories document from current registry for export/persist. */
export function categoriesForWorkingDataset(): CategoriesDocument {
  return serializeCategories()
}
