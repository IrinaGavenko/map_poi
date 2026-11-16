import type { Point } from '@type'
import {
  FALLBACK_CATEGORY,
  getCategoriesRegistry,
  getCategoryColor,
  getCategoryConfig,
  getCategoryDeclaredColor,
  getCategoryDeclaredViewIcon,
  getCategoryImageUrl,
  getCategoryListIcon,
  getCategoryVisualMode,
  getRootCategoryId,
  isRootCategory,
  isSvgIconRef,
  type MarkerVisualMode,
} from '@type/categories'
import {
  resolveCategoryIconSvg,
  resolveDisplayPictureUrl,
} from '@utils/categoryIconAssets'

export type PointIconConfig = {
  id: string
  color: string
  visualMode: MarkerVisualMode
  imageUrl?: string
  emoji: string
  /** Raw SVG for root pin head icon when `viewIcon` is an SVG path. */
  iconSvg?: string | null
  /**
   * Subcategory id when a badge should be shown.
   * Null if the subcategory has no `viewIcon` (badge hidden).
   */
  subcategoryId?: string | null
  subcategoryColor?: string
  subcategoryEmoji?: string
  subcategoryIconSvg?: string | null
}

export const CLUSTER_ICON_ID = 'cluster-button'

/** Small rectangle for `icon` / custom markers. */
export const ICON_MARKER_WIDTH = 56
export const ICON_MARKER_HEIGHT = 40

/** Square artboard for custom markers that show `display_picture` (SVG or photo). */
export const CUSTOM_MARKER_SIZE = 72

/** Large rectangle for `picture` / pinned markers. */
export const PICTURE_MARKER_WIDTH = 140
export const PICTURE_MARKER_HEIGHT = 100

export function getPointCategoryId(point: Point): string {
  if (point.primaryCategoryId && point.primaryCategoryId in getCategoriesRegistry()) {
    return point.primaryCategoryId
  }
  const fromList = point.categories.find((id) => id in getCategoriesRegistry())
  return fromList ?? FALLBACK_CATEGORY.id
}

/**
 * Leaf category for categorized markers (may be a subcategory).
 * Pinned/custom ignore subcategory hierarchy for styling.
 */
export function getPointLeafCategoryId(point: Point): string {
  return getPointCategoryId(point)
}

/** Root category used for the main categorized marker look. */
export function getPointRootCategoryId(point: Point): string {
  return getRootCategoryId(getPointLeafCategoryId(point))
}

/** Subcategory id when categorized leaf ≠ root; otherwise null. */
export function getPointSubcategoryId(point: Point): string | null {
  if (point.markerType !== 'categorized') return null
  const leaf = getPointLeafCategoryId(point)
  if (isRootCategory(leaf)) return null
  return leaf
}

/**
 * Subcategory id only when a badge should render.
 * No subcategory `viewIcon` → no circle (treat as root pin).
 */
export function getPointSubcategoryBadgeId(point: Point): string | null {
  const subcategoryId = getPointSubcategoryId(point)
  if (!subcategoryId) return null
  if (!getCategoryDeclaredViewIcon(subcategoryId)) return null
  return subcategoryId
}

export function resolveViewIconSvg(categoryId: string | null | undefined): string | null {
  const declared = getCategoryDeclaredViewIcon(categoryId)
  if (!declared || !isSvgIconRef(declared)) return null
  return resolveCategoryIconSvg(declared)
}

export function resolveViewIconEmoji(categoryId: string | null | undefined): string | undefined {
  const declared = getCategoryDeclaredViewIcon(categoryId)
  if (!declared || isSvgIconRef(declared)) return undefined
  return declared
}

/** MapLibre image id for this point (category id, or unique point art). */
export function getPointIconKey(point: Point): string {
  if (point.markerType === 'pinned') {
    return point.displayPicture ? `point:${point.id}` : getPointCategoryId(point)
  }
  if (point.markerType === 'custom') {
    // Unique art per custom point (display_picture / category icon — not categorized pin).
    if (point.displayPicture || point.primaryCategoryId) return `point:${point.id}`
    return getPointCategoryId(point)
  }

  // Categorized: composite key only when a subcategory badge is shown.
  const root = getPointRootCategoryId(point)
  const badgeId = getPointSubcategoryBadgeId(point)
  if (badgeId) return `${root}__${badgeId}`
  return root
}

export function getPointVisualMode(point: Point): MarkerVisualMode {
  if (point.markerType === 'pinned') return 'picture'
  if (point.markerType === 'custom') return 'icon'
  // Main marker look comes from the root category.
  return getCategoryVisualMode(getPointRootCategoryId(point))
}

export function getPointIconConfig(point: Point): PointIconConfig {
  const leafId = getPointLeafCategoryId(point)
  const rootId =
    point.markerType === 'categorized' ? getRootCategoryId(leafId) : leafId
  const badgeId =
    point.markerType === 'categorized' ? getPointSubcategoryBadgeId(point) : null
  const rootColor = getCategoryColor(rootId)
  const visualMode = getPointVisualMode(point)
  const imageUrl =
    resolveDisplayPictureUrl(point.displayPicture) ||
    (point.markerType === 'custom'
      ? resolveDisplayPictureUrl(getCategoryDeclaredViewIcon(rootId))
      : undefined) ||
    (point.markerType !== 'custom' ? getCategoryImageUrl(rootId) : undefined) ||
    undefined
  const rootIconSvg = resolveViewIconSvg(rootId)
  const rootEmoji = resolveViewIconEmoji(rootId) || getCategoryListIcon(rootId)

  // Sub without color → use root color; sub without icon → badge omitted above.
  const subcategoryColor = badgeId
    ? getCategoryDeclaredColor(badgeId) || rootColor
    : undefined

  return {
    id: rootId,
    color: rootColor,
    visualMode,
    imageUrl,
    emoji: rootEmoji,
    iconSvg: rootIconSvg,
    subcategoryId: badgeId,
    subcategoryColor,
    subcategoryEmoji: badgeId ? resolveViewIconEmoji(badgeId) : undefined,
    subcategoryIconSvg: badgeId ? resolveViewIconSvg(badgeId) : undefined,
  }
}

/** Whether this point should stay outside the MapLibre cluster source. */
export function isUnclusteredPoint(point: Point): boolean {
  return getPointVisualMode(point) === 'picture' || point.markerType === 'pinned'
}

export function resolvePointCategoryConfig(categoryId: string) {
  const config = getCategoryConfig(categoryId)
  return {
    ...config,
    color: getCategoryColor(categoryId),
  }
}
