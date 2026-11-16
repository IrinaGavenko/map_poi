import { useEffect, type RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { flyToUnclusteredPoints } from '@utils/mapFocus'
import type { MapFocusRequest } from './types'

export function useMapFocusRequest(
  mapRef: RefObject<maplibregl.Map | null>,
  focusRequest: MapFocusRequest | null | undefined,
) {
  useEffect(() => {
    const request = focusRequest
    if (!request || request.points.length === 0 || !mapRef.current) return
    const map = mapRef.current
    let frame = 0
    let cancelled = false

    const applyFocus = () => {
      if (cancelled) return
      frame = window.requestAnimationFrame(() => {
        if (cancelled || !mapRef.current) return
        map.resize()
        flyToUnclusteredPoints(map, request.points, {
          animate: request.animate !== false,
        })
      })
    }

    // Dataset can finish loading before the map style is ready; wait for load.
    if (map.loaded()) applyFocus()
    else map.once('load', applyFocus)

    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
      map.off('load', applyFocus)
    }
    // Re-apply whenever the focus request identity changes (dataset switch / collapse).
  }, [focusRequest?.key])
}
