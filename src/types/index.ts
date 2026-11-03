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

import type { PinnedMarker } from './pinned'
import type { CustomMarker } from './custom'
import type { CategorizedMarker } from './categorized'

/** Any marker wrapper matching `example_pinned|custom|categorized.json`. */
export type Marker = PinnedMarker | CustomMarker | CategorizedMarker

/** Legacy flat point shape still used by the current map UI. */
export type Point = {
  id: string
  name: string
  /** Nested points file, e.g. "FF.json" → loads `collapse-FF.json` */
  isCollapsible?: string
  type: string[]
  description: string
  icon: string
  picture: string[]
  link: string
  coordinates: {
    lat: number
    lng: number
  }
}

export type LatLng = {
  lat: number
  lng: number
}

export type CollapsePolygon = {
  color: string
  coordinates: LatLng[]
}

/** Nested collapse file: `{ polygon, points }` (legacy: bare `Point[]`). */
export type CollapseDataset = {
  polygon: CollapsePolygon | null
  points: Point[]
}
