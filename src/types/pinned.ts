/**
 * Pinned marker — source of truth: `src/data/example_pinned.json`
 * (Ignore `"//…"` comment keys; they are docs only.)
 */

export type PinnedCoordinates = {
  /** Latitude. Number from -90 to 90. */
  lat: number
  /** Longitude. Number from -180 to 180. */
  lng: number
}

/**
 * Popup content when the marker is clicked.
 * `null` on the point → popup is not displayed.
 */
export type PinnedPointContent = {
  name: string
  /** Default `[]`. Gallery in description; empty → section not displayed. */
  pictures?: string[]
  /** Default `null`. Empty/null → section not displayed. */
  description?: string | null
  /** Default `null`. Null → link section not displayed. */
  link?: string | null
  /**
   * Default `false`. When enabled, use a category id from categories.json
   * (`true` alone is incomplete — prefer `false | string`).
   */
  includeInCategorySearch?: boolean | string
  /** Default `false`. Collapsed with other markers in the same zone. */
  isCollapsible?: boolean
  /** Default `null`. Nested-zone file name when set. */
  isNested?: string | null
}

export type PinnedPoint = {
  id: string
  type: 'pinned'
  /** Marker image on the map. */
  display_picture: string
  coordinates: PinnedCoordinates
  /** `null` → no popup. */
  point_content: PinnedPointContent | null
}

export type PinnedMarker = {
  type: 'pinned'
  point: PinnedPoint
}
