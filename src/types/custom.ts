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
   * Default `false`. When set, must be a category id from categories.json;
   * marker uses that category’s display properties.
   */
  hasCategory?: boolean | string
  /**
   * Default `null`. Null only when `hasCategory` is false,
   * or the referenced category has no display_picture.
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
   * Default same as `hasCategory`. When enabled, needs a category id
   * from categories.json.
   */
  includeInCategorySearch?: boolean | string
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
