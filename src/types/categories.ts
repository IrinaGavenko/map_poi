/**
 * Categories — current shape matches `src/data/example_categories.json`.
 * Legacy pin/icon/picture runtime below is @deprecated but kept so the app runs.
 */

// ---------------------------------------------------------------------------
// Current (source of truth: example_categories.json + CategoryTypeConfig)
// ---------------------------------------------------------------------------

export type CategoryRenderType = 'pinned' | 'custom' | 'categorized'

export type CategoryType = string

export type CategoryTypeConfig = {
  type: CategoryRenderType
  priority?: number
  name: string
  id: string

  size?: number

  viewColor?: string | null
  viewIcon?: string | null
  viewPicture?: string | null
  viewPriority?: number

  categoryListIcon?: string | null
  categoryListPicture?: string | null
}

/** Full categories document (`example_categories.json` without `//` comment keys). */
export type CategoriesDocument = {
  version: number
  categories: Record<string, CategoryTypeConfig>
}

// ---------------------------------------------------------------------------
// @deprecated — previous pin | icon | picture model (keeps current map UI running)
// ---------------------------------------------------------------------------

/**
 * @deprecated Legacy map render mode. Prefer `CategoryRenderType` (`pinned` | `custom` | `categorized`).
 */
export type LegacyCategoryRenderType = 'pin' | 'icon' | 'picture'

/**
 * @deprecated Legacy style-group id. Prefer category `id` + `CategoryTypeConfig.type`.
 */
export type LegacyCategoryType =
  | 'transport'
  | 'rideshare'
  | 'redishare'
  | 'fifa'
  | 'global'
  | 'accommodation'
  | 'car'
  | 'stadium'
  | 'unknown'

/**
 * @deprecated Legacy style-group config (`CATEGORY_TYPE` values). Prefer `CategoryTypeConfig`.
 */
export type LegacyCategoryTypeConfig = {
  color?: string
  type: LegacyCategoryRenderType
}

/** @deprecated Prefer defaults from the categories document / `CategoryTypeConfig.viewColor`. */
export const DEFAULT_CATEGORY_COLOR = '#6b7280'

/** @deprecated Prefer `CategoryTypeConfig.viewPicture` / document defaults. */
export const DEFAULT_CATEGORY_PICTURE =
  'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'

/** @deprecated Prefer loading style from `CategoriesDocument`. */
export const CATEGORY_TYPE: Record<LegacyCategoryType, LegacyCategoryTypeConfig> = {
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

/**
 * @deprecated Prefer `CategoryTypeConfig`. Legacy POINT_CATEGORIES entry shape.
 */
export type PointCategoryConfig = {
  icon: string
  type: LegacyCategoryType
  title: string
}

/** @deprecated */
export type ResolvedPointCategoryConfig = PointCategoryConfig & {
  color: string
}

/** @deprecated Prefer `CategoriesDocument.categories`. */
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

/** @deprecated */
export type PointCategoryId = keyof typeof POINT_CATEGORIES

/** @deprecated */
export const AVAILABLE_POINT_CATEGORIES = Object.keys(POINT_CATEGORIES) as PointCategoryId[]

/** @deprecated */
export const FALLBACK_POINT_CATEGORY = {
  id: 'pin',
  icon: '📍',
  type: 'unknown',
  title: 'Pin',
} as const satisfies PointCategoryConfig & { id: string }

/** @deprecated */
export const POINT_CATEGORY_CONFIG: Record<string, PointCategoryConfig> = {
  ...POINT_CATEGORIES,
  [FALLBACK_POINT_CATEGORY.id]: {
    icon: FALLBACK_POINT_CATEGORY.icon,
    type: FALLBACK_POINT_CATEGORY.type,
    title: FALLBACK_POINT_CATEGORY.title,
  },
}

/** @deprecated */
export function getPointCategoryConfig(category: string): PointCategoryConfig {
  return POINT_CATEGORY_CONFIG[category] ?? POINT_CATEGORY_CONFIG[FALLBACK_POINT_CATEGORY.id]
}

/** @deprecated */
export function getCategoryTypeConfig(categoryType: LegacyCategoryType): LegacyCategoryTypeConfig {
  return CATEGORY_TYPE[categoryType]
}

/** @deprecated */
export function getCategoryColor(categoryId: string): string {
  const config = getPointCategoryConfig(categoryId)
  return CATEGORY_TYPE[config.type]?.color ?? DEFAULT_CATEGORY_COLOR
}

/** @deprecated */
export function resolvePointCategoryConfig(categoryId: string): ResolvedPointCategoryConfig {
  const config = getPointCategoryConfig(categoryId)
  return {
    ...config,
    color: getCategoryColor(categoryId),
  }
}

/** @deprecated */
export function getCategoryTitle(categoryId: string): string {
  const config = getPointCategoryConfig(categoryId)
  return config.title || categoryId
}

/** @deprecated Returns legacy pin/icon/picture mode for the current map UI. */
export function getCategoryRenderType(categoryId: string): LegacyCategoryRenderType {
  const config = getPointCategoryConfig(categoryId)
  return CATEGORY_TYPE[config.type]?.type ?? 'pin'
}

/** @deprecated */
export function isPictureIcon(icon: string): boolean {
  const value = icon.trim()
  return /^https?:\/\//i.test(value) || value.startsWith('/')
}

/** @deprecated */
export function getCategoryImageUrl(categoryId: string): string | undefined {
  const renderType = getCategoryRenderType(categoryId)
  if (renderType !== 'icon' && renderType !== 'picture') return undefined
  const { icon } = getPointCategoryConfig(categoryId)
  return isPictureIcon(icon) ? icon.trim() : DEFAULT_CATEGORY_PICTURE
}

/** @deprecated Prefer getCategoryImageUrl */
export function getPictureUrlForCategory(categoryId: string): string | undefined {
  return getCategoryImageUrl(categoryId)
}

/** @deprecated */
export function getPinEmojiForCategory(categoryId: string): string {
  const { icon } = getPointCategoryConfig(categoryId)
  return isPictureIcon(icon) ? '' : icon
}

/** @deprecated */
export const PICTURE_POINT_CATEGORY_IDS = (Object.keys(POINT_CATEGORY_CONFIG) as string[]).filter(
  (categoryId) => getCategoryRenderType(categoryId) === 'picture',
)

/** @deprecated */
export const ICON_POINT_CATEGORY_IDS = (Object.keys(POINT_CATEGORY_CONFIG) as string[]).filter(
  (categoryId) => getCategoryRenderType(categoryId) === 'icon',
)

/** @deprecated */
export const RECT_POINT_CATEGORY_IDS = [
  ...ICON_POINT_CATEGORY_IDS,
  ...PICTURE_POINT_CATEGORY_IDS,
]
