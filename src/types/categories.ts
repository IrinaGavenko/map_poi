export type PointTypeConfig = {
  color: string
  icon: string
}

/**
 * Available place types and their map/list styling.
 * Add or edit entries here to change filters, legend, and pin icons.
 */
export const POINT_TYPES = {
  beach: { color: '#0ea5e9', icon: '🏖️' },
  hotel: { color: '#8b5cf6', icon: '🏨' },
  museum: { color: '#d97706', icon: '🏛️' },
  nightlife: { color: '#ec4899', icon: '🍸' },
  park: { color: '#22c55e', icon: '🌳' },
  restaurant: { color: '#f97316', icon: '🍽️' },
  shopping: { color: '#ef4444', icon: '🛍️' },
} as const satisfies Record<string, PointTypeConfig>

export type PointTypeId = keyof typeof POINT_TYPES

export const AVAILABLE_POINT_TYPES = Object.keys(POINT_TYPES) as PointTypeId[]

/** Fallback when a point has no matching configured type */
export const FALLBACK_POINT_TYPE = {
  id: 'pin',
  color: '#6b7280',
  icon: '📍',
} as const satisfies PointTypeConfig & { id: string }

/** Lookup used for rendering (configured types + fallback) */
export const POINT_TYPE_CONFIG: Record<string, PointTypeConfig> = {
  ...POINT_TYPES,
  [FALLBACK_POINT_TYPE.id]: {
    color: FALLBACK_POINT_TYPE.color,
    icon: FALLBACK_POINT_TYPE.icon,
  },
}

export function getPointTypeConfig(type: string): PointTypeConfig {
  return POINT_TYPE_CONFIG[type] ?? POINT_TYPE_CONFIG[FALLBACK_POINT_TYPE.id]
}
