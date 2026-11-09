import maplibregl from 'maplibre-gl'
import { MOBILE_BREAKPOINT } from '@components/Drawer/constants'

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

function isMobileMap(map: maplibregl.Map): boolean {
  return map.getContainer().getBoundingClientRect().width <= MOBILE_BREAKPOINT
}

function focusPadding(map: maplibregl.Map): maplibregl.PaddingOptions | number {
  if (!isMobileMap(map)) {
    return 110
  }

  const { height } = map.getContainer().getBoundingClientRect()
  // Keep points in the visible map area above the bottom sheet, with roomy edges.
  const bottom = Math.min(Math.round(height * 0.45), 320)
  const edge = 64
  return {
    top: edge,
    left: edge,
    right: edge,
    bottom: Math.max(edge, bottom),
  }
}

type FocusOnPointsOptions = {
  clusterRadiusPx?: number
  /** When false, jump instantly (dataset open / switch). Default true. */
  animate?: boolean
}

/** Move camera so every point is in view and none of them share a cluster. */
export function flyToUnclusteredPoints(
  map: maplibregl.Map,
  points: LatLng[],
  clusterRadiusPxOrOptions: number | FocusOnPointsOptions = CLUSTER_RADIUS_PX,
): void {
  if (points.length === 0) return

  const options: FocusOnPointsOptions =
    typeof clusterRadiusPxOrOptions === 'number'
      ? { clusterRadiusPx: clusterRadiusPxOrOptions, animate: true }
      : clusterRadiusPxOrOptions
  const clusterRadiusPx = options.clusterRadiusPx ?? CLUSTER_RADIUS_PX
  const animate = options.animate !== false

  const mobile = isMobileMap(map)
  // Pull back a bit more on mobile so the cluster doesn't feel too tight.
  const unclusterZoom =
    zoomToUncluster(points, clusterRadiusPx) - (mobile ? 1.4 : 0.4)

  const moveTo = (center: maplibregl.LngLatLike, zoom: number) => {
    if (animate) map.flyTo({ center, zoom })
    else map.jumpTo({ center, zoom })
  }

  if (points.length === 1) {
    // Single-point datasets: use a readable city/landmark zoom, not "max(current, …)"
    // which keeps the previous dataset's zoom when jumping across the world.
    const zoom = animate
      ? Math.max(map.getZoom(), Math.min(14, unclusterZoom))
      : Math.min(14, Math.max(12, unclusterZoom))
    moveTo([points[0].lng, points[0].lat], zoom)
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
    padding: focusPadding(map),
    maxZoom: mobile ? 17 : 22,
  })

  if (camera?.center != null && camera.zoom != null) {
    moveTo(
      camera.center,
      Math.min(mobile ? 17 : 22, Math.max(camera.zoom, unclusterZoom)),
    )
    return
  }

  // Fallback when padding is too large for the viewport (common on mobile).
  const center = bounds.getCenter()
  moveTo(
    [center.lng, center.lat],
    Math.min(mobile ? 17 : 22, Math.max(map.getZoom(), unclusterZoom)),
  )
}
