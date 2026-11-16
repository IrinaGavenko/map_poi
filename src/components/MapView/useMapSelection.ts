import { useEffect, type MutableRefObject, type RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import type { Point } from '@type'
import { buildPopupContent } from './popupContent'
import { showPointPopup } from './mapSetup'

function selectedPopupContentKey(point: Point | undefined): string | null {
  if (!point || point.isNested || !point.hasPopup) return null
  return [
    point.id,
    point.name,
    point.description,
    point.link,
    point.categories.join(','),
    point.pictures[0] ?? '',
    point.coordinates.lat,
    point.coordinates.lng,
  ].join('|')
}

export function useMapSelection(
  mapRef: RefObject<maplibregl.Map | null>,
  popupRef: RefObject<maplibregl.Popup | null>,
  pointsRef: RefObject<Point[]>,
  points: Point[],
  selected: Point | null,
  closingPopupFromReact: MutableRefObject<boolean>,
) {
  const selectedId = selected?.id ?? null

  useEffect(() => {
    if (!mapRef.current) return

    if (!selectedId) {
      closingPopupFromReact.current = true
      popupRef.current?.remove()
      closingPopupFromReact.current = false
      return
    }

    const point = pointsRef.current?.find((p) => String(p.id) === String(selectedId))
    if (!point || point.isNested || !point.hasPopup) {
      closingPopupFromReact.current = true
      popupRef.current?.remove()
      closingPopupFromReact.current = false
      return
    }

    mapRef.current.flyTo({
      center: [point.coordinates.lng, point.coordinates.lat],
      zoom: Math.max(mapRef.current.getZoom(), 14),
    })

    showPointPopup(point, mapRef, popupRef)
  }, [selectedId])

  const selectedPopupKey = selectedPopupContentKey(
    points.find((p) => String(p.id) === String(selectedId)),
  )

  useEffect(() => {
    if (!selectedPopupKey || !popupRef.current?.isOpen()) return

    const point = pointsRef.current?.find((p) => String(p.id) === String(selectedId))
    if (!point || point.isNested || !point.hasPopup) {
      popupRef.current.remove()
      return
    }

    const active = document.activeElement
    const shouldRestore =
      active instanceof HTMLElement &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')

    popupRef.current
      .setLngLat([point.coordinates.lng, point.coordinates.lat])
      .setHTML(buildPopupContent(point))

    if (shouldRestore) {
      active.focus({ preventScroll: true })
    }
  }, [selectedPopupKey, selectedId])
}
