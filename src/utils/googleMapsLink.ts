import type { LatLng } from '@type'

/** Build Google Maps URL from coordinates (current default behavior). */
export function googleMapsUrlFromCoordinates(coordinates: LatLng): string {
  return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`
}

/**
 * Prefer an explicit `google_link` when non-empty; otherwise build from coordinates.
 */
export function resolveGoogleMapsUrl(options: {
  googleLink?: string | null
  coordinates: LatLng
}): string {
  const custom = options.googleLink?.trim()
  if (custom) return custom
  return googleMapsUrlFromCoordinates(options.coordinates)
}
