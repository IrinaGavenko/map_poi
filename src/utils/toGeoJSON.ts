import { getPointCategoryId, getPointIconKey } from '@utils/pointIcons'
import { getCategoryRenderType } from '@type/categories'
import type { Point } from '@type'

type PointFeature = {
  type: 'Feature'
  properties: {
    id: string
    name: string
    type: string[]
    description: string
    icon: string
    picture: string[]
    link: string
    isCollapsible: string | null
    iconKey: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

type FeatureCollection = {
  type: 'FeatureCollection'
  features: PointFeature[]
}

function pointToFeature(p: Point): PointFeature {
  return {
    type: 'Feature',
    properties: {
      id: p.id,
      name: p.name,
      type: p.type,
      description: p.description,
      icon: p.icon,
      picture: p.picture,
      link: p.link,
      isCollapsible: p.isCollapsible ?? null,
      iconKey: getPointIconKey(p),
    },
    geometry: {
      type: 'Point',
      coordinates: [p.coordinates.lng, p.coordinates.lat],
    },
  }
}

/**
 * `picture` categories stay unclustered.
 * `pin` and `icon` categories share the clustered source.
 */
export function splitPointsGeoJSON(points: Point[]): {
  clustered: FeatureCollection
  picture: FeatureCollection
} {
  const clustered: PointFeature[] = []
  const picture: PointFeature[] = []

  for (const point of points) {
    const feature = pointToFeature(point)
    if (getCategoryRenderType(getPointCategoryId(point)) === 'picture') {
      picture.push(feature)
    } else {
      clustered.push(feature)
    }
  }

  return {
    clustered: { type: 'FeatureCollection', features: clustered },
    picture: { type: 'FeatureCollection', features: picture },
  }
}

export const toGeoJSON = (points: Point[]): FeatureCollection => ({
  type: 'FeatureCollection',
  features: points.map(pointToFeature),
})
