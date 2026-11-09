export type { PinnedCoordinates, PinnedPointContent, PinnedPoint, PinnedMarker } from './pinned'
export type {
  CustomCoordinates,
  CustomPoint,
  CustomPointContent,
  CustomMarker,
} from './custom'
export type {
  CategorizedCoordinates,
  CategorizedPoint,
  CategorizedPointContent,
  CategorizedMarker,
} from './categorized'
export type {
  CategoryRenderType,
  CategoryType,
  CategoryTypeConfig,
  CategoriesDocument,
} from './categories'

import type { PinnedMarker } from './pinned'
import type { CustomMarker } from './custom'
import type { CategorizedMarker } from './categorized'
import type { CategoriesDocument } from './categories'

/** Any marker wrapper matching `example_pinned|custom|categorized.json`. */
export type Marker = PinnedMarker | CustomMarker | CategorizedMarker

export type MarkerKind = Marker['type']

export type LatLng = {
  lat: number
  lng: number
}

export type CollapsePolygon = {
  color: string
  coordinates: LatLng[]
}

/**
 * Normalized map/UI point derived from a `Marker`.
 * Field names follow the new schema semantics (gallery = pictures, nest file = isNested).
 */
export type Point = {
  id: string
  markerType: MarkerKind
  name: string
  description: string
  link: string
  /** Gallery images for popup / detail UI. */
  pictures: string[]
  /** Own map art for pinned/custom; null when art comes from the category. */
  displayPicture: string | null
  /**
   * Category ids used for legend / filter.
   * Empty → excluded from category search (always visible when filtering by type).
   */
  categories: string[]
  /** Primary category id used for icon/legend styling when available. */
  primaryCategoryId: string | null
  coordinates: LatLng
  /** Nested-zone file name (e.g. `"FF.json"`). */
  isNested: string | null
  /** Zone-merge flag from marker content (not the nest filename). */
  isCollapsible: boolean
  /** False when pinned `point_content` is null. */
  hasPopup: boolean
  priority: number
  /** Original marker wrapper (for round-trip edits). */
  source: Marker
}

/** Nested collapse file: `{ polygon, points }` (points may be Marker[] or legacy flat). */
export type CollapseDataset = {
  polygon: CollapsePolygon | null
  points: Point[]
}

export type MapDatasetMeta = {
  id?: string
  title?: string
  description?: string
}

/** Versioned map dataset (`miami.json` / general document). */
export type MapDataset = {
  version: number
  meta?: MapDatasetMeta
  categories: CategoriesDocument | string
  points: Point[]
  collapses?: Record<string, CollapseDataset>
}
