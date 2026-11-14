import { FALLBACK_CATEGORY } from '@type/categories'
import type { MarkerKind, Point } from '@type'
import { pointToMarker } from '@utils/normalizeMarker'
import { getPinnedSize } from '@utils/pinnedSize'

function newId(kind: MarkerKind): string {
  return `new-${kind}-${Date.now()}`
}

export function createPoint(
  coordinates: { lat: number; lng: number },
  markerType: MarkerKind = 'categorized',
): Point {
  const id = newId(markerType)
  const pinnedSize = getPinnedSize()

  if (markerType === 'pinned') {
    const point: Point = {
      id,
      markerType: 'pinned',
      name: 'New place',
      description: '',
      link: '',
      googleLink: '',
      pictures: [],
      displayPicture: '',
      categories: [],
      primaryCategoryId: null,
      coordinates,
      isNested: null,
      isCollapsible: false,
      hasPopup: true,
      priority: 0,
      pinnedSize,
      source: {
        type: 'pinned',
        point: {
          id,
          type: 'pinned',
          display_picture: '',
          coordinates,
          point_content: {
            name: 'New place',
            pictures: [],
            description: null,
            link: null,
          },
        },
      },
    }
    point.source = pointToMarker(point)
    return point
  }

  if (markerType === 'custom') {
    const point: Point = {
      id,
      markerType: 'custom',
      name: 'New place',
      description: '',
      link: '',
      googleLink: '',
      pictures: [],
      displayPicture: null,
      categories: [],
      primaryCategoryId: null,
      coordinates,
      isNested: null,
      isCollapsible: false,
      hasPopup: true,
      priority: 0,
      pinnedSize,
      source: {
        type: 'custom',
        point: {
          id,
          type: 'custom',
          hasCategory: false,
          category: null,
          display_picture: null,
          coordinates,
        },
        point_content: {
          name: 'New place',
          pictures: [],
          description: null,
          link: null,
          priority: 0,
        },
      },
    }
    point.source = pointToMarker(point)
    return point
  }

  const categoryId = FALLBACK_CATEGORY.id
  const point: Point = {
    id,
    markerType: 'categorized',
    name: 'New place',
    description: '',
    link: '',
    googleLink: '',
    pictures: [],
    displayPicture: null,
    categories: [categoryId],
    primaryCategoryId: categoryId,
    coordinates,
    isNested: null,
    isCollapsible: false,
    hasPopup: true,
    priority: 0,
    pinnedSize,
    source: {
      type: 'categorized',
      point: {
        id,
        type: 'categorized',
        categories: [categoryId],
        coordinates,
      },
      point_content: {
        name: 'New place',
        picture: [],
        description: '',
        link: '',
        priority: 0,
      },
    },
  }
  point.source = pointToMarker(point)
  return point
}
