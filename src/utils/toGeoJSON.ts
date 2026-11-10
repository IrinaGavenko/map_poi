import { getPointIconKey, getPointVisualMode, isUnclusteredPoint } from '@utils/pointIcons'
import { pinnedSizeToIconScale } from '@utils/pinnedSize'
import type { Point } from '@type'

type PointFeature = {
  type: 'Feature'
  properties: {
    id: string
    name: string
    categories: string[]
    description: string
    pictures: string[]
    link: string
    isNested: string | null
    hasPopup: boolean
    markerType: string
    iconKey: string
    iconAnchor: 'center' | 'bottom'
    iconSize: number
    priority: number
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
  const visualMode = getPointVisualMode(p)
  return {
    type: 'Feature',
    properties: {
      id: p.id,
      name: p.name,
      categories: p.categories,
      description: p.description,
      pictures: p.pictures,
      link: p.link,
      isNested: p.isNested,
      hasPopup: p.hasPopup,
      markerType: p.markerType,
      iconKey: getPointIconKey(p),
      iconAnchor: visualMode === 'pin' ? 'bottom' : 'center',
      iconSize:
        p.markerType === 'pinned' ? pinnedSizeToIconScale(p.pinnedSize) : 1,
      priority: p.priority,
    },
    geometry: {
      type: 'Point',
      coordinates: [p.coordinates.lng, p.coordinates.lat],
    },
  }
}

/**
 * Pinned / picture markers stay unclustered.
 * Categorized pins (and small icon rects) share the clustered source.
 */
export function splitPointsGeoJSON(points: Point[]): {
  clustered: FeatureCollection
  picture: FeatureCollection
} {
  const clustered: PointFeature[] = []
  const picture: PointFeature[] = []

  // Higher priority drawn later within each collection (MapLibre order).
  const sorted = [...points].sort((a, b) => a.priority - b.priority)

  for (const point of sorted) {
    const feature = pointToFeature(point)
    if (isUnclusteredPoint(point)) {
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
