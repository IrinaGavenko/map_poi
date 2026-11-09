/**
 * Categories — runtime shape matches `src/data/categories.json` / `example_categories.json`.
 */

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

/** Full categories document (`categories.json` without `//` comment keys). */
export type CategoriesDocument = {
  version: number
  categories: Record<string, CategoryTypeConfig>
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

export function getCategoriesRegistry(): Record<string, CategoryTypeConfig> {
  return registry
}

export function setCategoriesRegistry(doc: CategoriesDocument | null | undefined): void {
  const next: Record<string, CategoryTypeConfig> = {
    [FALLBACK_CATEGORY.id]: { ...FALLBACK_CATEGORY },
  }

  if (doc?.categories) {
    for (const [id, config] of Object.entries(doc.categories)) {
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

export function getCategoryConfig(categoryId: string | null | undefined): CategoryTypeConfig {
  if (categoryId && registry[categoryId]) return registry[categoryId]
  return registry[FALLBACK_CATEGORY.id] ?? FALLBACK_CATEGORY
}

export function getCategoryTitle(categoryId: string): string {
  return getCategoryConfig(categoryId).name || categoryId
}

export function getCategoryColor(categoryId: string | null | undefined): string {
  const color = getCategoryConfig(categoryId).viewColor
  return color && color.trim() ? color.trim() : DEFAULT_CATEGORY_COLOR
}

export function isPictureIcon(icon: string): boolean {
  const value = icon.trim()
  return /^https?:\/\//i.test(value) || value.startsWith('/') || value.startsWith('assets/')
}

/** Map/list image from category config, if any. */
export function getCategoryImageUrl(categoryId: string | null | undefined): string | undefined {
  const config = getCategoryConfig(categoryId)
  const picture = config.viewPicture?.trim() || config.categoryListPicture?.trim()
  if (picture) return picture
  const icon = config.viewIcon?.trim() || config.categoryListIcon?.trim()
  if (icon && isPictureIcon(icon)) return icon
  return undefined
}

export function getCategoryListIcon(categoryId: string | null | undefined): string {
  const config = getCategoryConfig(categoryId)
  const icon = config.categoryListIcon?.trim() || config.viewIcon?.trim()
  if (icon && !isPictureIcon(icon)) return icon
  return '📍'
}

/**
 * Visual mode for a category family:
 * - pinned → large picture marker
 * - custom → rectangular picture/icon marker
 * - categorized → pin (or small icon rect when viewPicture is set)
 */
export function getCategoryVisualMode(categoryId: string | null | undefined): MarkerVisualMode {
  const config = getCategoryConfig(categoryId)
  if (config.type === 'pinned') return 'picture'
  if (config.type === 'custom') return 'icon'
  if (config.viewPicture?.trim()) return 'icon'
  return 'pin'
}

export function knownCategoryIds(): string[] {
  return Object.keys(registry)
    .filter((id) => id !== FALLBACK_CATEGORY.id || registry[id] === FALLBACK_CATEGORY)
    .filter((id) => id in registry)
    .sort()
}
