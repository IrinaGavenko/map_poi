import { useEffect, type MutableRefObject, type RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import type { CollapsePolygon, Point } from '@type'
import type { MapFocusRequest } from './types'
import {
  bindMapInteractions,
  createMapInstance,
  createPlacePopup,
  loadMapSourcesAndLayers,
} from './mapSetup'

type UseMapInstanceArgs = {
  mapRef: MutableRefObject<maplibregl.Map | null>
  popupRef: MutableRefObject<maplibregl.Popup | null>
  pointsRef: RefObject<Point[]>
  collapsePolygonRef: RefObject<CollapsePolygon | null | undefined>
  focusRequestRef: RefObject<MapFocusRequest | null | undefined>
  selectedIdRef: MutableRefObject<string | null>
  addingPointRef: MutableRefObject<boolean>
  onAddPointRef: MutableRefObject<
    ((coordinates: { lat: number; lng: number }) => void) | undefined
  >
  setSelectedRef: MutableRefObject<(point: Point) => void>
  clearSelectedRef: MutableRefObject<() => void>
  closingPopupFromReact: MutableRefObject<boolean>
  iconsReadyRef: MutableRefObject<boolean>
}

export function useMapInstance({
  mapRef,
  popupRef,
  pointsRef,
  collapsePolygonRef,
  focusRequestRef,
  selectedIdRef,
  addingPointRef,
  onAddPointRef,
  setSelectedRef,
  clearSelectedRef,
  closingPopupFromReact,
  iconsReadyRef,
}: UseMapInstanceArgs) {
  useEffect(() => {
    const map = createMapInstance('map')
    mapRef.current = map

    const popup = createPlacePopup()
    popupRef.current = popup

    popup.on('close', () => {
      if (closingPopupFromReact.current) return
      clearSelectedRef.current()
    })

    map.on('load', async () => {
      await loadMapSourcesAndLayers({
        map,
        points: pointsRef.current ?? [],
        collapsePolygon: collapsePolygonRef.current,
        pendingFocus: focusRequestRef.current,
      })
      iconsReadyRef.current = true

      bindMapInteractions(map, {
        pointsRef: pointsRef as { current: Point[] },
        selectedIdRef,
        addingPointRef,
        onAddPointRef,
        setSelectedRef,
        clearSelectedRef,
        closingPopupFromReact,
        popupRef,
        mapRef,
      })
    })

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
      iconsReadyRef.current = false
    }
  }, [])
}
