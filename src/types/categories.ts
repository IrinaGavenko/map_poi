export type PointCategoryConfig = {
  color: string
  icon: string
}

export const POINT_CATEGORIES = {
  beach: { color: '#0ea5e9', icon: '🏖️' },
  hotel: { color: '#8b5cf6', icon: '🏨' },
  museum: { color: '#d97706', icon: '🏛️' },
  nightlife: { color: '#ec4899', icon: '🍸' },
  park: { color: '#22c55e', icon: '🌳' },
  restaurant: { color: '#f97316', icon: '🍽️' },
  shopping: { color: '#ef4444', icon: '🛍️' },
} as const satisfies Record<string, PointCategoryConfig>

export type PointCategoryId = keyof typeof POINT_CATEGORIES

export const AVAILABLE_POINT_CATEGORIES = Object.keys(POINT_CATEGORIES) as PointCategoryId[]

// if we recieve a new point with unknown category
export const FALLBACK_POINT_CATEGORY = {
  id: 'pin',
  color: '#6b7280',
  icon: '📍',
} as const satisfies PointCategoryConfig & { id: string }

export const POINT_CATEGORY_CONFIG: Record<string, PointCategoryConfig> = {
  ...POINT_CATEGORIES,
  [FALLBACK_POINT_CATEGORY.id]: {
    color: FALLBACK_POINT_CATEGORY.color,
    icon: FALLBACK_POINT_CATEGORY.icon,
  },
}

export function getPointCategoryConfig(category: string): PointCategoryConfig {
  return POINT_CATEGORY_CONFIG[category] ?? POINT_CATEGORY_CONFIG[FALLBACK_POINT_CATEGORY.id]
}
