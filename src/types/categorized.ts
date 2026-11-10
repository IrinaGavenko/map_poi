/**
 * Categorized marker — source of truth: `src/data/example_categorized.json`
 * (Ignore `"//…"` comment keys; they are docs only.)
 */

export type CategorizedCoordinates = {
  /** Latitude. Number from -90 to 90. */
  lat: number
  /** Longitude. Number from -180 to 180. */
  lng: number
}

export type CategorizedPoint = {
  id: string
  type: 'categorized'
  /** Non-empty array of category ids from categories.json. */
  categories: [string, ...string[]]
  coordinates: CategorizedCoordinates
}

/** Root sibling of `point` (not nested under `point`). */
export type CategorizedPointContent = {
  name: string
  /**
   * Optional gallery images for the description UI (not map pin art).
   * Use `[]` if none. Map art comes from the category config.
   */
  picture?: string[]
  /** Free-text body (address, hours, notes). Can be `""`. */
  description?: string
  /** URL string, or `""` if none. */
  link?: string
  /**
   * Optional. If non-empty, used for “Open in Google Maps”.
   * If empty/null/omitted, the link is built from `coordinates`.
   */
  google_link?: string | null
  /** Integer >= 0. Default `0`. Higher wins when markers are close. */
  priority?: number
}

export type CategorizedMarker = {
  type: 'categorized'
  point: CategorizedPoint
  point_content: CategorizedPointContent
}
