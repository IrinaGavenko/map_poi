export type CategoryRenderType = 'pin' | 'icon' | 'picture'

export type CategoryType =
  | 'transport'
  | 'rideshare'
  | 'redishare'
  | 'fifa'
  | 'global'
  | 'accommodation'
  | 'car'
  | 'stadium'
  | 'unknown'

export type CategoryTypeConfig = {
  color?: string
  type: CategoryRenderType
}

export const DEFAULT_CATEGORY_COLOR = '#6b7280'

/** Used when a picture-type category has no image URL in `POINT_CATEGORIES.icon`. */
export const DEFAULT_CATEGORY_PICTURE =
  'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'


export const CATEGORY_TYPE: Record<CategoryType, CategoryTypeConfig> = {
  unknown: {
    type: 'pin',
    color: '#6b7280',
  },
  transport: {
    type: 'pin',
    color: '#0ea5e9',
  },
  car: {
    type: 'pin',
    color: '#8b5cf6',
  },
  stadium: {
    type: 'pin',
    color: '#22c55e',
  },
  rideshare: {
    type: 'pin',
    color: '#22c55e',
  },
  redishare: {
    type: 'pin',
    color: '#22c55e',
  },
  global: {
    type: 'picture',
  },
  fifa: {
    type: 'icon',
  },
  accommodation: {
    type: 'pin',
    color: '#d97706',
  },
}

export type PointCategoryConfig = {
  icon: string
  type: CategoryType
  title: string
}

export type ResolvedPointCategoryConfig = PointCategoryConfig & {
  color: string
}

export const POINT_CATEGORIES = {
  airport: { icon: '🛫', type: 'transport', title: 'Airport' },
  car_rental: { icon: '🚗', type: 'car', title: 'Car Rental' },
  hotel: { icon: '🏨', type: 'accommodation', title: 'Hotel' },
  transit_stop: { icon: '🚏', type: 'transport', title: 'Transit Stop' },
  transit_station: { icon: '🚉', type: 'transport', title: 'Transit Station' },
  bus_hub: { icon: '🚍', type: 'transport', title: 'Bus Hub' },
  shuttle_stop: { icon: '🚌', type: 'rideshare', title: 'Shuttle Stop' },
  redishare_stop: { icon: '🚕', type: 'redishare', title: 'Redishare Stop' },
  parking_lot: { icon: '🅿️', type: 'car', title: 'Parking Lot' },
  gate: { icon: '🚪', type: 'stadium', title: 'Gate' },
  fifa_store: {
    icon: `${import.meta.env.BASE_URL}assets/fifaStore.jpg`,
    type: 'fifa',
    title: 'FIFA Store',
  },
  fifa_museum: {
    icon: `${import.meta.env.BASE_URL}assets/fifaMuseum.png`,
    type: 'fifa',
    title: 'FIFA Museum',
  },
  fifa_reward: {
    icon: `${import.meta.env.BASE_URL}assets/fifaReward.png`,
    type: 'fifa',
    title: 'FIFA Reward',
  },
  fifa_fan_festival: {
    icon: `${import.meta.env.BASE_URL}assets/fifaFanfest.jpeg`,
    type: 'global',
    title: 'FIFA Fan Festival',
  },
} as const satisfies Record<string, PointCategoryConfig>

export type PointCategoryId = keyof typeof POINT_CATEGORIES

export const AVAILABLE_POINT_CATEGORIES = Object.keys(POINT_CATEGORIES) as PointCategoryId[]

export const FALLBACK_POINT_CATEGORY = {
  id: 'pin',
  icon: '📍',
  type: 'unknown',
  title: 'Pin',
} as const satisfies PointCategoryConfig & { id: string }

export const POINT_CATEGORY_CONFIG: Record<string, PointCategoryConfig> = {
  ...POINT_CATEGORIES,
  [FALLBACK_POINT_CATEGORY.id]: {
    icon: FALLBACK_POINT_CATEGORY.icon,
    type: FALLBACK_POINT_CATEGORY.type,
    title: FALLBACK_POINT_CATEGORY.title,
  },
}

export function getPointCategoryConfig(category: string): PointCategoryConfig {
  return POINT_CATEGORY_CONFIG[category] ?? POINT_CATEGORY_CONFIG[FALLBACK_POINT_CATEGORY.id]
}

export function getCategoryTypeConfig(categoryType: CategoryType): CategoryTypeConfig {
  return CATEGORY_TYPE[categoryType]
}

export function getCategoryColor(categoryId: string): string {
  const config = getPointCategoryConfig(categoryId)
  return CATEGORY_TYPE[config.type]?.color ?? DEFAULT_CATEGORY_COLOR
}

export function resolvePointCategoryConfig(categoryId: string): ResolvedPointCategoryConfig {
  const config = getPointCategoryConfig(categoryId)
  return {
    ...config,
    color: getCategoryColor(categoryId),
  }
}

export function getCategoryTitle(categoryId: string): string {
  const config = getPointCategoryConfig(categoryId)
  return config.title || categoryId
}

export function getCategoryRenderType(categoryId: string): CategoryRenderType {
  const config = getPointCategoryConfig(categoryId)
  return CATEGORY_TYPE[config.type]?.type ?? 'pin'
}

export function isPictureIcon(icon: string): boolean {
  const value = icon.trim()
  return /^https?:\/\//i.test(value) || value.startsWith('/')
}

/** Image URL for `icon` and `picture` render types (from POINT_CATEGORIES.icon). */
export function getCategoryImageUrl(categoryId: string): string | undefined {
  const renderType = getCategoryRenderType(categoryId)
  if (renderType !== 'icon' && renderType !== 'picture') return undefined
  const { icon } = getPointCategoryConfig(categoryId)
  return isPictureIcon(icon) ? icon.trim() : DEFAULT_CATEGORY_PICTURE
}

/** @deprecated Prefer getCategoryImageUrl — kept for call sites that mean picture/icon images. */
export function getPictureUrlForCategory(categoryId: string): string | undefined {
  return getCategoryImageUrl(categoryId)
}

export function getPinEmojiForCategory(categoryId: string): string {
  const { icon } = getPointCategoryConfig(categoryId)
  return isPictureIcon(icon) ? '' : icon
}

export const PICTURE_POINT_CATEGORY_IDS = (Object.keys(POINT_CATEGORY_CONFIG) as string[]).filter(
  (categoryId) => getCategoryRenderType(categoryId) === 'picture',
)

export const ICON_POINT_CATEGORY_IDS = (Object.keys(POINT_CATEGORY_CONFIG) as string[]).filter(
  (categoryId) => getCategoryRenderType(categoryId) === 'icon',
)

export const RECT_POINT_CATEGORY_IDS = [
  ...ICON_POINT_CATEGORY_IDS,
  ...PICTURE_POINT_CATEGORY_IDS,
]
