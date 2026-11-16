import { useEffect, useRef, useState } from 'react'
import type { Point } from '@type'
import type { MapFocusRequest } from '../useCollapseSession'

type DatasetCameraArgs = {
  ready: boolean
  mapRevision: number
  points: Point[]
  collapseActive: boolean
  onMapRevisionChange: () => void
}

/** Clear selection/collapse on dataset replace; focus root points when a new map loads. */
export function useDatasetCamera({
  ready,
  mapRevision,
  points,
  collapseActive,
  onMapRevisionChange,
}: DatasetCameraArgs) {
  const datasetFocusKey = useRef(0)
  const focusedMapRevisionRef = useRef<number | null>(null)
  const [datasetFocus, setDatasetFocus] = useState<MapFocusRequest | null>(null)

  useEffect(() => {
    if (!ready) return
    onMapRevisionChange()
    focusedMapRevisionRef.current = null
    setDatasetFocus(null)
  }, [mapRevision])

  useEffect(() => {
    if (!ready) return
    if (collapseActive) return
    if (points.length === 0) return
    if (focusedMapRevisionRef.current === mapRevision) return

    focusedMapRevisionRef.current = mapRevision
    datasetFocusKey.current += 1
    setDatasetFocus({
      key: datasetFocusKey.current,
      points: points.map((point) => ({
        lat: point.coordinates.lat,
        lng: point.coordinates.lng,
      })),
      animate: false,
    })
  }, [collapseActive, ready, mapRevision, points])

  const clearDatasetFocus = () => {
    focusedMapRevisionRef.current = null
    setDatasetFocus(null)
  }

  return { datasetFocus, clearDatasetFocus }
}
