import { useEffect, type MutableRefObject, type RefObject } from 'react'
import type maplibregl from 'maplibre-gl'
import { loadMapIcons } from '@utils/pointIcons'
import { collapseMaskToGeoJSON, collapsePolygonToGeoJSON } from '@utils/collapsePolygon'
import { splitPointsGeoJSON } from '@utils/toGeoJSON'
import type { CollapsePolygon, Point } from '@type'
import {
  COLLAPSE_MASK_SOURCE,
  COLLAPSE_POLYGON_SOURCE,
  PICTURE_POINTS_SOURCE,
  POINTS_SOURCE,
} from './constants'

export function useCollapsePolygonSync(
  mapRef: RefObject<maplibregl.Map | null>,
  collapsePolygon: CollapsePolygon | null | undefined,
) {
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const polygonSrc = map.getSource(COLLAPSE_POLYGON_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    const maskSrc = map.getSource(COLLAPSE_MASK_SOURCE) as maplibregl.GeoJSONSource | undefined
    if (polygonSrc) polygonSrc.setData(collapsePolygonToGeoJSON(collapsePolygon))
    if (maskSrc) maskSrc.setData(collapseMaskToGeoJSON(collapsePolygon))
  }, [collapsePolygon])
}

export function useMapPointsSync(
  mapRef: RefObject<maplibregl.Map | null>,
  points: Point[],
  iconsReadyRef: RefObject<boolean>,
  pointsUpdateIdRef: MutableRefObject<number>,
) {
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const clusteredSrc = map.getSource(POINTS_SOURCE) as maplibregl.GeoJSONSource | undefined
    const pictureSrc = map.getSource(PICTURE_POINTS_SOURCE) as
      | maplibregl.GeoJSONSource
      | undefined
    if (!clusteredSrc || !pictureSrc) return

    const active = document.activeElement
    const shouldRestore =
      active instanceof HTMLElement &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      !map.getContainer().contains(active)

    const updateId = ++pointsUpdateIdRef.current
    // Apply GeoJSON synchronously so the isNested parent and outside markers
    // disappear before any async icon work can race and restore them.
    const initial = splitPointsGeoJSON(points)
    clusteredSrc.setData(initial.clustered)
    pictureSrc.setData(initial.picture)

    void (async () => {
      if (iconsReadyRef.current) {
        await loadMapIcons(map, points)
      }
      if (updateId !== pointsUpdateIdRef.current) return

      const { clustered, picture } = splitPointsGeoJSON(points)
      clusteredSrc.setData(clustered)
      pictureSrc.setData(picture)

      if (shouldRestore) {
        active.focus({ preventScroll: true })
      }
    })()
  }, [points])
}
