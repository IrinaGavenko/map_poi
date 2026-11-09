import { FALLBACK_CATEGORY } from '@type/categories'
import type { Point } from '@type'
import { pointToMarker } from '@utils/normalizeMarker'

export function createPoint(coordinates: { lat: number; lng: number }): Point {
  const categoryId = FALLBACK_CATEGORY.id
  const id = `new-${Date.now()}`
  const point: Point = {
    id,
    markerType: 'categorized',
    name: 'New place',
    description: '',
    link: '',
    pictures: [],
    displayPicture: null,
    categories: [categoryId],
    primaryCategoryId: categoryId,
    coordinates,
    isNested: null,
    isCollapsible: false,
    hasPopup: true,
    priority: 0,
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
