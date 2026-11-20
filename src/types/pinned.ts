/**
 * Pinned marker — **source of truth** for this shape.
 * Keep `prompts/create-pinned-marker-form.md` in sync when this file changes.
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
   * Optional. If non-empty, used for “Open in Google Maps”.
   * If empty/null/omitted, the link is built from `coordinates`.
   */
  google_link?: string | null
  /**
   * Default `false`. When a non-empty string, that category id is used for
   * legend / filter. `true` alone is invalid and ignored.
   */
  includeInCategorySearch?: false | string
  /** Default `false`. Collapsed with other markers in the same zone. */
  isCollapsible?: boolean
  /** Default `null`. Exact key into the dataset `collapses` map when set. */
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
