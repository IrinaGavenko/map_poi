import { getPointIconKey } from '@utils/pointIcons'
import type { Point } from '@type'

export const toGeoJSON = (points: Point[]) => ({
  type: 'FeatureCollection' as const,
  features: points.map((p) => ({
    type: 'Feature' as const,
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
      type: 'Point' as const,
      coordinates: [p.coordinates.lng, p.coordinates.lat],
    },
  })),
})
