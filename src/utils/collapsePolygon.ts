import type { CollapsePolygon } from '@type'

/** GeoJSON polygon ring (closed) from collapse polygon coordinates. */
export function collapsePolygonToGeoJSON(
  polygon: CollapsePolygon | null | undefined,
): GeoJSON.FeatureCollection {
  if (!polygon || polygon.coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }

  const ring = polygon.coordinates.map(
    (c) => [c.lng, c.lat] as [number, number],
  )
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { color: polygon.color },
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    ],
  }
}
