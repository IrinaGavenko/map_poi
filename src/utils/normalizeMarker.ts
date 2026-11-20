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

/** Pinned category search: only a non-empty string id counts. */
function pinnedCategoryIds(include: unknown): string[] {
  if (typeof include === 'string' && include.trim()) return [include.trim()]
  return []
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
  const categories = pinnedCategoryIds(content?.includeInCategorySearch)
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

  const hasCategory = marker.point.hasCategory === true
  const categoryId = hasCategory ? asString(marker.point.category ?? null) : null
  if (hasCategory && !categoryId) return null
  const categories = categoryId ? [categoryId] : []

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
    primaryCategoryId: categoryId,
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
  if (categories.length === 0) return null

  return {
    id: marker.point.id,
    markerType: 'categorized',
    name: content.name ?? '',
    description: content.description?.trim() ?? '',
    link: content.link?.trim() ?? '',
    googleLink: content.google_link?.trim() ?? '',
    pictures: asStringArray(content.picture),
    displayPicture: null,
    categories,
    primaryCategoryId: categories[0],
    coordinates: { ...marker.point.coordinates },
    isNested: null,
    isCollapsible: false,
    hasPopup: true,
    priority: typeof content.priority === 'number' ? content.priority : 0,
    pinnedSize: getPinnedSize(),
    source: marker,
  }
}

export function normalizeMarker(raw: unknown): Point | null {
  if (!isMarker(raw)) return null

  if (raw.type === 'pinned') {
    return normalizePinned(raw)
  }

  if (raw.type === 'custom') {
    if (!raw.point_content || typeof raw.point_content !== 'object') return null
    return normalizeCustom(raw)
  }

  if (!raw.point_content || typeof raw.point_content !== 'object') return null
  return normalizeCategorized(raw)
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
              includeInCategorySearch: point.categories[0] ?? false,
              isCollapsible: point.isCollapsible,
              isNested: point.isNested,
            }
          : null,
      },
    }
    return marker
  }

  if (kind === 'custom') {
    const hasCategory = Boolean(point.primaryCategoryId)
    const marker: CustomMarker = {
      type: 'custom',
      point: {
        id: point.id,
        type: 'custom',
        hasCategory,
        category: hasCategory ? point.primaryCategoryId : null,
        display_picture: point.displayPicture,
        coordinates,
      },
      point_content: {
        name: point.name,
        pictures: [...point.pictures],
        description: point.description || null,
        link: point.link || null,
        google_link: point.googleLink || null,
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
