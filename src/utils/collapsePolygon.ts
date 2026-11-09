import type { CollapsePolygon } from '@type'

function closedRing(
  coordinates: { lat: number; lng: number }[],
): [number, number][] {
  const ring = coordinates.map((c) => [c.lng, c.lat] as [number, number])
  if (ring.length < 2) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }
  return ring
}

/** GeoJSON polygon ring (closed) from collapse polygon coordinates. */
export function collapsePolygonToGeoJSON(
  polygon: CollapsePolygon | null | undefined,
): GeoJSON.FeatureCollection {
  if (!polygon || polygon.coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }

  const ring = closedRing(polygon.coordinates)
  if (ring.length < 4) return { type: 'FeatureCollection', features: [] }

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

/**
 * Full-map dimming mask with a hole for the nested zone.
 * Drawn above markers so anything outside the zone is covered.
 */
export function collapseMaskToGeoJSON(
  polygon: CollapsePolygon | null | undefined,
): GeoJSON.FeatureCollection {
  if (!polygon || polygon.coordinates.length < 2) {
    return { type: 'FeatureCollection', features: [] }
  }

  const hole = closedRing(polygon.coordinates)
  if (hole.length < 4) return { type: 'FeatureCollection', features: [] }

  // Outer ring (world) must wind opposite to the hole for MapLibre fills.
  const outer: [number, number][] = [
    [-180, -85],
    [-180, 85],
    [180, 85],
    [180, -85],
    [-180, -85],
  ]

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { color: '#0f172a' },
        geometry: {
          type: 'Polygon',
          coordinates: [outer, hole],
        },
      },
    ],
  }
}
