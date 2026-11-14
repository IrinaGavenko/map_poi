/**
 * Custom marker — source of truth: `src/data/example_custom.json`
 * (Ignore `"//…"` comment keys; they are docs only.)
 */

export type CustomCoordinates = {
  /** Latitude. Number from -90 to 90. */
  lat: number
  /** Longitude. Number from -180 to 180. */
  lng: number
}

export type CustomPoint = {
  id: string
  type: 'custom'
  /**
   * Default `false`. When `true`, marker can be filtered/searched by category
   * and `category` must be set to a category id from categories.json.
   */
  hasCategory?: boolean
  /**
   * Required when `hasCategory` is true. Category id from categories.json;
   * marker may use that category’s display properties.
   * Omit / null when `hasCategory` is false.
   */
  category?: string | null
  /**
   * Default `null`. Null only when `hasCategory` is false,
   * or the referenced category has no display picture.
   */
  display_picture?: string | null
  coordinates: CustomCoordinates
}

/** Root sibling of `point` (not nested under `point`). */
export type CustomPointContent = {
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
  /** Default `false`. Collapsed with other markers in the same zone. */
  isCollapsible?: boolean
  /** Integer >= 0. Default `0`. Higher wins when markers are close. */
  priority?: number
}

export type CustomMarker = {
  type: 'custom'
  point: CustomPoint
  point_content: CustomPointContent
}
