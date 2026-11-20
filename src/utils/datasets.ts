import type { CollapseDataset, CollapsePolygon, LatLng } from '@type'
import { normalizeMarkers } from '@utils/normalizeMarker'

function isLatLng(value: unknown): value is LatLng {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number'
}

/** Strict polygon: `{ color?, coordinates: LatLng[] }` with at least two points. */
function normalizePolygon(value: unknown): CollapsePolygon | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const coordinates = Array.isArray(record.coordinates)
    ? record.coordinates.filter(isLatLng).map((c) => ({ lat: c.lat, lng: c.lng }))
    : []
  if (coordinates.length < 2) return null

  const color =
    typeof record.color === 'string' && record.color.trim()
      ? record.color.trim()
      : '#3b82f6'

  return { color, coordinates }
}

/**
 * Strict collapse zone: `{ polygon, points }`.
 * `points` must be an array of Marker wrappers; bare arrays are rejected.
 */
export function normalizeCollapseDataset(data: unknown): CollapseDataset {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { polygon: null, points: [] }
  }

  const record = data as Record<string, unknown>
  if (!Array.isArray(record.points)) {
    return { polygon: null, points: [] }
  }

  return {
    polygon: normalizePolygon(record.polygon),
    points: normalizeMarkers(record.points),
  }
}
