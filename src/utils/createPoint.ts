import { FALLBACK_POINT_CATEGORY } from '@type/categories'
import type { Point } from '@type'

export function createPoint(coordinates: { lat: number; lng: number }): Point {
  return {
    id: `new-${Date.now()}`,
    name: 'New place',
    type: ['park'],
    description: '',
    icon: FALLBACK_POINT_CATEGORY.id,
    picture: [],
    link: '',
    coordinates,
  }
}
