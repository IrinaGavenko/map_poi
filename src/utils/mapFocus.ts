import maplibregl from 'maplibre-gl'

export const CLUSTER_RADIUS_PX = 40

type LatLng = { lat: number; lng: number }

function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)))
}

function minPairDistanceMeters(points: LatLng[]): number {
  let min = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const d = haversineMeters(points[i], points[j])
      if (d > 0 && d < min) min = d
    }
  }
  return min
}

/** Zoom so closest pair is farther apart than cluster radius in screen pixels. */
function zoomToUncluster(points: LatLng[], clusterRadiusPx: number): number {
  const minMeters = minPairDistanceMeters(points)
  if (!Number.isFinite(minMeters) || minMeters <= 0) return 16

  const lat =
    points.reduce((sum, p) => sum + p.lat, 0) / Math.max(points.length, 1)
  const metersPerPixelNeeded = minMeters / (clusterRadiusPx + 4)
  return Math.log2(
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) / metersPerPixelNeeded,
  )
}

/** Fly so every point is in view and none of them share a cluster. */
export function flyToUnclusteredPoints(
  map: maplibregl.Map,
  points: LatLng[],
  clusterRadiusPx = CLUSTER_RADIUS_PX,
): void {
  if (points.length === 0) return

  if (points.length === 1) {
    map.flyTo({
      center: [points[0].lng, points[0].lat],
      zoom: Math.max(map.getZoom(), zoomToUncluster(points, clusterRadiusPx) - 0.4),
    })
    return
  }

  const bounds = new maplibregl.LngLatBounds(
    [points[0].lng, points[0].lat],
    [points[0].lng, points[0].lat],
  )
  for (const point of points) {
    bounds.extend([point.lng, point.lat])
  }

  const camera = map.cameraForBounds(bounds, {
    padding: 240,
    maxZoom: 22,
  })
  if (!camera?.center || camera.zoom == null) return

  const zoom = Math.min(
    22,
    Math.max(camera.zoom, zoomToUncluster(points, clusterRadiusPx)) - 0.4,
  )

  map.flyTo({
    center: camera.center,
    zoom,
  })
}
