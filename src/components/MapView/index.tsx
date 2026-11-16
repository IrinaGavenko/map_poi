import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import type { MapViewProps } from './types'
import { useMapInstance } from './useMapInstance'
import { useMapFocusRequest } from './useMapFocusRequest'
import { useCollapsePolygonSync, useMapPointsSync } from './useMapDataSync'
import { useMapSelection } from './useMapSelection'
import './MapView.css'

export default function MapView({
  points,
  selected,
  setSelected,
  clearSelected,
  addingPoint = false,
  onAddPoint,
  focusRequest = null,
  collapsePolygon = null,
}: MapViewProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const pointsRef = useRef(points)
  const collapsePolygonRef = useRef(collapsePolygon)
  const focusRequestRef = useRef(focusRequest)
  const selectedIdRef = useRef<string | null>(selected?.id ?? null)
  const addingPointRef = useRef(addingPoint)
  const onAddPointRef = useRef(onAddPoint)
  const setSelectedRef = useRef(setSelected)
  const clearSelectedRef = useRef(clearSelected)
  const closingPopupFromReact = useRef(false)
  const iconsReadyRef = useRef(false)
  const pointsUpdateIdRef = useRef(0)

  useEffect(() => {
    pointsRef.current = points
  }, [points])

  useEffect(() => {
    focusRequestRef.current = focusRequest
  }, [focusRequest])

  useEffect(() => {
    collapsePolygonRef.current = collapsePolygon
  }, [collapsePolygon])

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? null
  }, [selected?.id])

  useEffect(() => {
    addingPointRef.current = addingPoint
    const map = mapRef.current
    if (!map) return
    map.getCanvas().style.cursor = addingPoint ? 'crosshair' : ''
  }, [addingPoint])

  useEffect(() => {
    onAddPointRef.current = onAddPoint
  }, [onAddPoint])

  useEffect(() => {
    setSelectedRef.current = setSelected
  }, [setSelected])

  useEffect(() => {
    clearSelectedRef.current = clearSelected
  }, [clearSelected])

  useMapInstance({
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
  })

  useMapFocusRequest(mapRef, focusRequest)
  useCollapsePolygonSync(mapRef, collapsePolygon)
  useMapPointsSync(mapRef, points, iconsReadyRef, pointsUpdateIdRef)
  useMapSelection(
    mapRef,
    popupRef,
    pointsRef,
    points,
    selected,
    closingPopupFromReact,
  )

  return <div id="map" style={{ height: '100%', width: '100%' }} />
}
