import { getPointIconKey } from '@utils/pointIcons'
import type { Point } from '@type'

export const toGeoJSON = (points: Point[]) => ({
  type: 'FeatureCollection' as const,
  features: points.map((p) => ({
    type: 'Feature' as const,
    properties: { ...p, iconKey: getPointIconKey(p) },
    geometry: {
      type: 'Point' as const,
      coordinates: [p.coordinates.lng, p.coordinates.lat],
    },
  })),
})
