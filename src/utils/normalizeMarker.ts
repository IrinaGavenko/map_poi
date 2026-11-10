import type {
  CategorizedMarker,
  CustomMarker,
  Marker,
  MarkerKind,
  PinnedMarker,
  Point,
} from '@type'
import { getPinnedSize } from '@utils/pinnedSize'

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
}

function asCoords(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.lat !== 'number' || typeof record.lng !== 'number') return null
  return { lat: record.lat, lng: record.lng }
}

function categorySearchIds(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function stripCommentKeys<T extends Record<string, unknown>>(record: T): T {
  const next = { ...record }
  for (const key of Object.keys(next)) {
    if (key.startsWith('//') || key.startsWith('$')) delete next[key]
  }
  return next
}

export function isMarker(value: unknown): value is Marker {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  const type = record.type
  if (type !== 'pinned' && type !== 'custom' && type !== 'categorized') return false
  if (!record.point || typeof record.point !== 'object') return false
  const point = record.point as Record<string, unknown>
  return typeof point.id === 'string' && asCoords(point.coordinates) !== null
}

function normalizePinned(marker: PinnedMarker): Point {
  const content = marker.point.point_content
  const hasPopup = content !== null && content !== undefined
  const name = content?.name ?? ''
  const pictures = asStringArray(content?.pictures)
  const include = content?.includeInCategorySearch
  const categories = categorySearchIds(include)
  const nested = asString(content?.isNested ?? null)

  return {
    id: marker.point.id,
    markerType: 'pinned',
    name,
    description: content?.description?.trim() ?? '',
    link: content?.link?.trim() ?? '',
    googleLink: content?.google_link?.trim() ?? '',
    pictures,
    displayPicture: asString(marker.point.display_picture),
    categories,
    primaryCategoryId: categories[0] ?? null,
    coordinates: { ...marker.point.coordinates },
    isNested: nested,
    isCollapsible: Boolean(content?.isCollapsible),
    hasPopup,
    priority: 100,
    pinnedSize: getPinnedSize(),
    source: marker,
  }
}

function normalizeCustom(marker: CustomMarker): Point | null {
  const content = marker.point_content
  if (!content || typeof content !== 'object') return null

  const hasCategory = marker.point.hasCategory
  const include =
    content.includeInCategorySearch !== undefined
      ? content.includeInCategorySearch
      : hasCategory
  const fromInclude = categorySearchIds(include)
  const fromHas = categorySearchIds(hasCategory)
  const categories = fromInclude.length > 0 ? fromInclude : fromHas
  const primary =
    (typeof hasCategory === 'string' && hasCategory.trim()) || categories[0] || null

  return {
    id: marker.point.id,
    markerType: 'custom',
    name: content.name ?? '',
    description: content.description?.trim() ?? '',
    link: content.link?.trim() ?? '',
    googleLink: content.google_link?.trim() ?? '',
    pictures: asStringArray(content.pictures),
    displayPicture: asString(marker.point.display_picture ?? null),
    categories,
    primaryCategoryId: primary,
    coordinates: { ...marker.point.coordinates },
    isNested: null,
    isCollapsible: Boolean(content.isCollapsible),
    hasPopup: true,
    priority: typeof content.priority === 'number' ? content.priority : 0,
    pinnedSize: getPinnedSize(),
    source: marker,
  }
}

function normalizeCategorized(marker: CategorizedMarker): Point | null {
  const content = marker.point_content
  if (!content || typeof content !== 'object') return null

  const categories = asStringArray(marker.point.categories)
  const safeCategories =
    categories.length > 0 ? (categories as [string, ...string[]]) : (['other'] as [string, ...string[]])

  return {
    id: marker.point.id,
    markerType: 'categorized',
    name: content.name ?? '',
    description: content.description?.trim() ?? '',
    link: content.link?.trim() ?? '',
    googleLink: content.google_link?.trim() ?? '',
    pictures: asStringArray(content.picture),
    displayPicture: null,
    categories: [...safeCategories],
    primaryCategoryId: safeCategories[0],
    coordinates: { ...marker.point.coordinates },
    isNested: null,
    isCollapsible: false,
    hasPopup: true,
    priority: typeof content.priority === 'number' ? content.priority : 0,
    pinnedSize: getPinnedSize(),
    source: marker,
  }
}

/**
 * Custom/categorized expect `point_content` as a root sibling of `point`.
 * Lift it out when authors nest it under `point` by mistake.
 */
function liftPointContent(
  marker: Record<string, unknown>,
  point: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const root = marker.point_content
  if (root && typeof root === 'object') {
    return stripCommentKeys(root as Record<string, unknown>)
  }
  const nested = point.point_content
  if (nested && typeof nested === 'object') {
    delete point.point_content
    return stripCommentKeys(nested as Record<string, unknown>)
  }
  return undefined
}

export function normalizeMarker(raw: unknown): Point | null {
  if (!isMarker(raw)) return null
  const cleaned = stripCommentKeys(raw as unknown as Record<string, unknown>)
  const point = stripCommentKeys(
    (cleaned.point as Record<string, unknown>) ?? {},
  )

  if (cleaned.type === 'pinned') {
    const pinned = { ...cleaned, point } as unknown as PinnedMarker
    if (pinned.point.point_content && typeof pinned.point.point_content === 'object') {
      pinned.point.point_content = stripCommentKeys(
        pinned.point.point_content as unknown as Record<string, unknown>,
      ) as PinnedMarker['point']['point_content']
    }
    return normalizePinned(pinned)
  }

  const pointContent = liftPointContent(cleaned, point)

  if (cleaned.type === 'custom') {
    const custom = {
      ...cleaned,
      point,
      point_content: pointContent,
    } as unknown as CustomMarker
    return normalizeCustom(custom)
  }

  const categorized = {
    ...cleaned,
    point,
    point_content: pointContent,
  } as unknown as CategorizedMarker
  return normalizeCategorized(categorized)
}

export function normalizeMarkers(data: unknown): Point[] {
  if (!Array.isArray(data)) return []
  return data.map(normalizeMarker).filter((point): point is Point => point !== null)
}

/** Apply UI edits back onto the underlying Marker wrapper. */
export function applyPointEdits(point: Point, edits: Partial<Point>): Point {
  const next: Point = {
    ...point,
    ...edits,
    pictures: edits.pictures ? [...edits.pictures] : [...point.pictures],
    categories: edits.categories ? [...edits.categories] : [...point.categories],
    coordinates: edits.coordinates
      ? { ...edits.coordinates }
      : { ...point.coordinates },
    pinnedSize: edits.pinnedSize ?? point.pinnedSize,
  }

  next.source = pointToMarker(next)
  return next
}

export function pointToMarker(point: Point): Marker {
  const kind: MarkerKind = point.markerType
  const coordinates = { ...point.coordinates }

  if (kind === 'pinned') {
    const marker: PinnedMarker = {
      type: 'pinned',
      point: {
        id: point.id,
        type: 'pinned',
        display_picture: point.displayPicture ?? '',
        coordinates,
        point_content: point.hasPopup
          ? {
              name: point.name,
              pictures: [...point.pictures],
              description: point.description || null,
              link: point.link || null,
              google_link: point.googleLink || null,
              includeInCategorySearch:
                point.categories[0] ?? false,
              isCollapsible: point.isCollapsible,
              isNested: point.isNested,
            }
          : null,
      },
    }
    return marker
  }

  if (kind === 'custom') {
    const marker: CustomMarker = {
      type: 'custom',
      point: {
        id: point.id,
        type: 'custom',
        hasCategory: point.primaryCategoryId ?? false,
        display_picture: point.displayPicture,
        coordinates,
      },
      point_content: {
        name: point.name,
        pictures: [...point.pictures],
        description: point.description || null,
        link: point.link || null,
        google_link: point.googleLink || null,
        includeInCategorySearch: point.categories[0] ?? false,
        isCollapsible: point.isCollapsible,
        priority: point.priority,
      },
    }
    return marker
  }

  const categories =
    point.categories.length > 0
      ? (point.categories as [string, ...string[]])
      : (['other'] as [string, ...string[]])

  const marker: CategorizedMarker = {
    type: 'categorized',
    point: {
      id: point.id,
      type: 'categorized',
      categories,
      coordinates,
    },
    point_content: {
      name: point.name,
      picture: [...point.pictures],
      description: point.description,
      link: point.link,
      google_link: point.googleLink || null,
      priority: point.priority,
    },
  }
  return marker
}
