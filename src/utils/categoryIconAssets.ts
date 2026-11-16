/**
 * Resolves category `viewIcon` values that point at SVG assets under
 * `src/components/Icons/`. Paths are normalized so config can use forms like:
 * - `components/Icons/02-coffee.svg`
 * - `components/Icons/03-restaurant`
 * - `02-coffee.svg`
 */

import pinSvg from '@components/Icons/01-pin.svg?raw'
import coffeeSvg from '@components/Icons/02-coffee.svg?raw'
import restaurantSvg from '@components/Icons/03-restaurant.svg?raw'
import pinWithCategorySvg from '@components/Icons/04-pin-with-category.svg?raw'
import cameraSvg from '@components/Icons/camera.svg?raw'

import pinUrl from '@components/Icons/01-pin.svg'
import coffeeUrl from '@components/Icons/02-coffee.svg'
import restaurantUrl from '@components/Icons/03-restaurant.svg'
import pinWithCategoryUrl from '@components/Icons/04-pin-with-category.svg'
import cameraUrl from '@components/Icons/camera.svg'

type IconAsset = {
  svg: string
  url: string
}

/** Canonical path stored on categories (matches Icons folder). */
export type CategoryIconOption = {
  id: string
  path: string
  label: string
  url: string
}

const ASSETS_BY_KEY: Record<string, IconAsset> = {
  'components/icons/01-pin.svg': { svg: pinSvg, url: pinUrl },
  'components/icons/02-coffee.svg': { svg: coffeeSvg, url: coffeeUrl },
  'components/icons/03-restaurant.svg': { svg: restaurantSvg, url: restaurantUrl },
  'components/icons/04-pin-with-category.svg': {
    svg: pinWithCategorySvg,
    url: pinWithCategoryUrl,
  },
  'components/icons/camera.svg': { svg: cameraSvg, url: cameraUrl },
}

/** All bundled icons available in the new-category picker. */
export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'pin', path: 'components/Icons/01-pin.svg', label: 'Pin', url: pinUrl },
  {
    id: 'coffee',
    path: 'components/Icons/02-coffee.svg',
    label: 'Coffee',
    url: coffeeUrl,
  },
  {
    id: 'restaurant',
    path: 'components/Icons/03-restaurant.svg',
    label: 'Restaurant',
    url: restaurantUrl,
  },
  {
    id: 'pin-with-category',
    path: 'components/Icons/04-pin-with-category.svg',
    label: 'Pin with badge',
    url: pinWithCategoryUrl,
  },
  {
    id: 'camera',
    path: 'components/Icons/camera.svg',
    label: 'Camera',
    url: cameraUrl,
  },
]

export const DEFAULT_CATEGORY_ICON_PATH = CATEGORY_ICON_OPTIONS[0]?.path ?? 'components/Icons/01-pin.svg'

/** Normalize a config path / filename to the registry key. */
export function normalizeCategoryIconPath(raw: string): string {
  let value = raw.trim().replace(/\\/g, '/')
  value = value.replace(/^@components\//i, 'components/')
  value = value.replace(/^\/?src\//i, '')
  value = value.replace(/^\.\//, '')
  if (!value.includes('/')) {
    value = `components/Icons/${value}`
  }
  if (!/\.svg$/i.test(value)) {
    value = `${value}.svg`
  }
  return value.toLowerCase()
}

export function isSvgIconRef(icon: string | null | undefined): boolean {
  if (!icon?.trim()) return false
  const value = icon.trim()
  if (/^https?:\/\//i.test(value)) return false
  if (/\.svg$/i.test(value)) return true
  if (/icons\//i.test(value)) return true
  return normalizeCategoryIconPath(value) in ASSETS_BY_KEY
}

export function resolveCategoryIconSvg(icon: string | null | undefined): string | null {
  if (!icon?.trim() || !isSvgIconRef(icon)) return null
  return ASSETS_BY_KEY[normalizeCategoryIconPath(icon)]?.svg ?? null
}

export function resolveCategoryIconUrl(icon: string | null | undefined): string | null {
  if (!icon?.trim() || !isSvgIconRef(icon)) return null
  return ASSETS_BY_KEY[normalizeCategoryIconPath(icon)]?.url ?? null
}

export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Resolve a marker `display_picture` to a loadable URL:
 * bundled `components/Icons/*.svg`, http(s), or public path.
 */
export function resolveDisplayPictureUrl(
  value: string | null | undefined,
): string | undefined {
  if (!value?.trim()) return undefined
  const raw = value.trim()
  const bundledUrl = resolveCategoryIconUrl(raw)
  if (bundledUrl) return bundledUrl
  const bundledSvg = resolveCategoryIconSvg(raw)
  if (bundledSvg) return svgToDataUrl(bundledSvg)
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('/')) {
    return raw
  }
  // Fall through to Vite base + relative public path.
  return `${import.meta.env.BASE_URL}${raw.replace(/^\.\//, '')}`
}
