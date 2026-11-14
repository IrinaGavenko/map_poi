/**
 * Categories — runtime shape matches `categories_SPB.json` / `categories.json`.
 *
 * Document map key may be `categoryTypes` (SPB) or `categories` (legacy Miami).
 * Subcategories (categorized markers only) set `rootCategoryId`.
 */

export type CategoryRenderType = 'pinned' | 'custom' | 'categorized'

export type CategoryType = string

export type CategoryTypeConfig = {
  id: string
  /** Display name. Optional on lean subcategories (falls back to id). */
  name?: string
  /** Marker family. Roots usually set this; subcategories inherit from root. */
  type?: CategoryRenderType
  /**
   * When set, this entry is a subcategory of that root.
   * Roots omit this (or use null). Used for categorized markers only.
   */
  rootCategoryId?: string | null

  priority?: number
  size?: number

  viewColor?: string | null
  viewIcon?: string | null
  /**
   * Image for map/view art. Used by **custom** (and pinned) categories only.
   * Categorized categories are pin + `viewIcon` — do not set this for them.
   */
  viewPicture?: string | null
  viewPriority?: number

  categoryListIcon?: string | null
  categoryListPicture?: string | null
}

/** Full categories document. */
export type CategoriesDocument = {
  version: number
  defaults?: {
    color?: string
    picture?: string
    fallbackCategoryId?: string
  }
  /** SPB / preferred key. */
  categoryTypes?: Record<string, CategoryTypeConfig>
  /** Legacy Miami key (same entry shape). */
  categories?: Record<string, CategoryTypeConfig>
}

/** Visual mode used by map icons / legend (derived from category + marker). */
export type MarkerVisualMode = 'pin' | 'icon' | 'picture'

export const DEFAULT_CATEGORY_COLOR = '#6b7280'

export const DEFAULT_CATEGORY_PICTURE =
  'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'

export const FALLBACK_CATEGORY: CategoryTypeConfig = {
  id: 'other',
  name: 'Other',
  type: 'categorized',
  priority: 0,
  viewColor: DEFAULT_CATEGORY_COLOR,
  viewIcon: '📍',
  viewPicture: null,
  categoryListIcon: '📍',
  categoryListPicture: null,
}

let registry: Record<string, CategoryTypeConfig> = {
  [FALLBACK_CATEGORY.id]: FALLBACK_CATEGORY,
}

function categoryMapFromDoc(
  doc: CategoriesDocument | null | undefined,
): Record<string, CategoryTypeConfig> | null {
  if (!doc) return null
  if (doc.categoryTypes && typeof doc.categoryTypes === 'object') return doc.categoryTypes
  if (doc.categories && typeof doc.categories === 'object') return doc.categories
  return null
}

export function getCategoriesRegistry(): Record<string, CategoryTypeConfig> {
  return registry
}

export function setCategoriesRegistry(doc: CategoriesDocument | null | undefined): void {
  const next: Record<string, CategoryTypeConfig> = {
    [FALLBACK_CATEGORY.id]: { ...FALLBACK_CATEGORY },
  }

  const map = categoryMapFromDoc(doc)
  if (map) {
    for (const [id, config] of Object.entries(map)) {
      if (id.startsWith('//')) continue
      if (!config || typeof config !== 'object') continue
      next[id] = {
        ...config,
        id: typeof config.id === 'string' && config.id ? config.id : id,
      }
    }
  }

  registry = next
}

/** Add or replace a single category entry without resetting the registry. */
export function upsertCategory(config: CategoryTypeConfig): void {
  const id = (config.id || '').trim()
  if (!id || id.startsWith('//')) return
  registry = {
    ...registry,
    [id]: { ...config, id },
  }
}

/** True when the category has no `rootCategoryId` (legend / filter list item). */
export function isRootCategory(categoryId: string | null | undefined): boolean {
  if (!categoryId) return false
  const config = registry[categoryId]
  if (!config) return false
  const root = config.rootCategoryId?.trim()
  return !root
}

/** Root id for a category (itself if already a root). */
export function getRootCategoryId(categoryId: string | null | undefined): string {
  if (!categoryId) return FALLBACK_CATEGORY.id
  const config = registry[categoryId]
  if (!config) return FALLBACK_CATEGORY.id
  const root = config.rootCategoryId?.trim()
  if (root && registry[root]) return root
  return categoryId in registry ? categoryId : FALLBACK_CATEGORY.id
}

/** Subcategory ids that point at this root. */
export function getSubcategoryIds(rootId: string): string[] {
  return Object.keys(registry)
    .filter((id) => registry[id]?.rootCategoryId?.trim() === rootId)
    .sort()
}

/**
 * Expand selected root filter ids to include their subcategories
 * (so filtering by "food" also matches "coffee").
 */
export function expandCategoryFilterIds(selectedRootIds: string[]): string[] {
  if (selectedRootIds.length === 0) return []
  const expanded = new Set<string>()
  for (const id of selectedRootIds) {
    expanded.add(id)
    for (const sub of getSubcategoryIds(id)) expanded.add(sub)
  }
  return [...expanded]
}

/** Resolved config: subcategories inherit missing fields from their root. */
export function getCategoryConfig(categoryId: string | null | undefined): CategoryTypeConfig {
  if (!categoryId || !registry[categoryId]) {
    return registry[FALLBACK_CATEGORY.id] ?? FALLBACK_CATEGORY
  }

  const config = registry[categoryId]
  const rootId = config.rootCategoryId?.trim()
  if (!rootId || !registry[rootId]) return config

  const root = registry[rootId]
  return {
    ...root,
    ...config,
    id: config.id,
    name: config.name?.trim() || config.id,
    type: config.type ?? root.type ?? 'categorized',
    rootCategoryId: rootId,
  }
}

export function getCategoryTitle(categoryId: string): string {
  const config = getCategoryConfig(categoryId)
  return config.name?.trim() || categoryId
}

export function getCategoryColor(categoryId: string | null | undefined): string {
  const color = getCategoryDeclaredColor(categoryId)
  return color ?? DEFAULT_CATEGORY_COLOR
}

/** Declared `viewColor` only — null when unset (callers may fall back to root). */
export function getCategoryDeclaredColor(
  categoryId: string | null | undefined,
): string | null {
  const color = getCategoryConfig(categoryId).viewColor?.trim()
  return color || null
}

/** Declared `viewIcon` only — null when unset (no subcategory badge without this). */
export function getCategoryDeclaredViewIcon(
  categoryId: string | null | undefined,
): string | null {
  const icon = getCategoryConfig(categoryId).viewIcon?.trim()
  return icon || null
}

export function isSvgIconRef(icon: string): boolean {
  const value = icon.trim()
  if (!value || /^https?:\/\//i.test(value)) return false
  if (/\.svg$/i.test(value)) return true
  if (/icons\//i.test(value)) return true
  return false
}

export function isPictureIcon(icon: string): boolean {
  const value = icon.trim()
  if (isSvgIconRef(value)) return false
  return /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('assets/')
}

function resolveCategoryRenderType(
  categoryId: string | null | undefined,
): CategoryRenderType | undefined {
  const config = getCategoryConfig(categoryId)
  if (config.type) return config.type
  if (config.rootCategoryId) {
    return getCategoryConfig(config.rootCategoryId).type
  }
  return undefined
}

/** Map/list image from category config (custom/pinned only — not categorized). */
export function getCategoryImageUrl(categoryId: string | null | undefined): string | undefined {
  const config = getCategoryConfig(categoryId)
  // Categorized markers are pin + viewIcon; category+image is the custom type.
  if (resolveCategoryRenderType(categoryId) === 'categorized') return undefined
  const picture = config.viewPicture?.trim() || config.categoryListPicture?.trim()
  if (picture) return picture
  const icon = config.viewIcon?.trim() || config.categoryListIcon?.trim()
  if (icon && isPictureIcon(icon)) return icon
  return undefined
}

/** Emoji (or short text) for list/legend — skips SVG path refs. */
export function getCategoryListIcon(categoryId: string | null | undefined): string {
  const config = getCategoryConfig(categoryId)
  for (const candidate of [config.categoryListIcon, config.viewIcon]) {
    const icon = candidate?.trim()
    if (icon && !isPictureIcon(icon) && !isSvgIconRef(icon)) return icon
  }
  return '📍'
}

/**
 * Visual mode for a category family:
 * - pinned → large picture marker
 * - custom → rectangular picture/icon marker (uses viewPicture)
 * - categorized → pin + viewIcon only (never an image marker)
 */
export function getCategoryVisualMode(categoryId: string | null | undefined): MarkerVisualMode {
  const type = resolveCategoryRenderType(categoryId)
  if (type === 'pinned') return 'picture'
  if (type === 'custom') return 'icon'
  return 'pin'
}

export function knownCategoryIds(): string[] {
  return Object.keys(registry).sort()
}

/** Root category ids only (for legend / filters). */
export function knownRootCategoryIds(): string[] {
  return Object.keys(registry).filter((id) => isRootCategory(id)).sort()
}
