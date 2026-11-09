import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import {
  CLUSTER_ICON_ID,
  getPointIconConfig,
  getPointVisualMode,
  loadMapIcons,
} from '@utils/pointIcons'
import { CLUSTER_RADIUS_PX, flyToUnclusteredPoints } from '@utils/mapFocus'
import { collapseMaskToGeoJSON, collapsePolygonToGeoJSON } from '@utils/collapsePolygon'
import { splitPointsGeoJSON } from '@utils/toGeoJSON'
import { getCategoryTitle } from '@type/categories'
import { resolvePublicUrl } from '@utils/publicUrl'
import type { CollapsePolygon, Point } from '@type'
import './MapView.css'

const COLLAPSE_POLYGON_SOURCE = 'collapse-polygon'
const COLLAPSE_POLYGON_LINE = 'collapse-polygon-line'
const COLLAPSE_POLYGON_FILL = 'collapse-polygon-fill'
const COLLAPSE_MASK_SOURCE = 'collapse-mask'
const COLLAPSE_MASK_FILL = 'collapse-mask-fill'

type MapFocusRequest = {
  key: number
  points: { lat: number; lng: number }[]
}

type MapViewProps = {
  points: Point[]
  selected: Point | null
  setSelected: (point: Point) => void
  clearSelected: () => void
  addingPoint?: boolean
  onAddPoint?: (coordinates: { lat: number; lng: number }) => void
  focusRequest?: MapFocusRequest | null
  collapsePolygon?: CollapsePolygon | null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildPopupContent(point: Point): string {
  const config = getPointIconConfig(point)
  const visualMode = getPointVisualMode(point)
  const { lat, lng } = point.coordinates
  const color = config.color
  const categories = point.categories
    .map(
      (type) =>
        `<span class="map-popup-tag" style="--popup-accent:${color}">${escapeHtml(getCategoryTitle(type))}</span>`,
    )
    .join('')
  const galleryUrl = point.pictures[0] ? resolvePublicUrl(point.pictures[0]) : ''
  const image = galleryUrl
    ? `<div class="map-popup-media"><img class="map-popup-image" src="${escapeHtml(galleryUrl)}" alt="" /></div>`
    : `<div class="map-popup-media map-popup-media--empty" style="--popup-accent:${color}"></div>`
  const logo =
    (visualMode === 'icon' || visualMode === 'picture') && config.imageUrl
      ? `<span class="map-popup-icon map-popup-icon--image" aria-hidden style="border-color:${color}">
          <img src="${escapeHtml(config.imageUrl)}" alt="" />
        </span>`
      : `<span class="map-popup-icon" aria-hidden style="background:${color}">${escapeHtml(config.emoji)}</span>`
  const moreInfo = point.link
    ? `<a class="map-popup-link" href="${escapeHtml(point.link)}" target="_blank" rel="noopener noreferrer">
        <span class="map-popup-link-icon" aria-hidden>↗</span>
        More info
      </a>`
    : ''
  const description = point.description
    ? `<p class="map-popup-description">${escapeHtml(point.description)}</p>`
    : ''
  const googleMaps = `<a class="map-popup-link map-popup-link--secondary" href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer">
        <span class="map-popup-link-icon" aria-hidden>📍</span>
        Open in Google Maps
      </a>`

  return `
    <div class="map-popup" style="--popup-accent:${color}">
      ${image}
      <div class="map-popup-body">
        <div class="map-popup-heading">
          ${logo}
          <div class="map-popup-heading-text">
            <h3 class="map-popup-title">${escapeHtml(point.name)}</h3>
            <div class="map-popup-tags">${categories}</div>
          </div>
        </div>
        ${description}
        <div class="map-popup-actions">
          ${moreInfo}
          ${googleMaps}
        </div>
      </div>
    </div>
  `
}

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

  useEffect(() => {
    if (!focusRequest || !mapRef.current) return
    const map = mapRef.current

    const frame = window.requestAnimationFrame(() => {
      map.resize()
      flyToUnclusteredPoints(map, focusRequest.points)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [focusRequest])

  useEffect(() => {
    const map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [-80.2, 25.77],
      zoom: 11,
    })

    mapRef.current = map
    const popup = new maplibregl.Popup({
      closeButton: true,
      maxWidth: 'min(300px, calc(100vw - 24px))',
      className: 'place-popup',
      anchor: 'center',
      offset: 0,
    })
    popupRef.current = popup

    const showPointPopup = (point: Point) => {
      if (!point.hasPopup) return
      const mapInstance = mapRef.current
      const popupInstance = popupRef.current
      if (!mapInstance || !popupInstance) return

      popupInstance
        .setLngLat([point.coordinates.lng, point.coordinates.lat])
        .setHTML(buildPopupContent(point))
        .addTo(mapInstance)
    }

    popup.on('close', () => {
      if (closingPopupFromReact.current) return
      clearSelectedRef.current()
    })

    const setPointer = () => {
      if (addingPointRef.current) return
      map.getCanvas().style.cursor = 'pointer'
    }
    const clearPointer = () => {
      map.getCanvas().style.cursor = addingPointRef.current ? 'crosshair' : ''
    }

    const onPointClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return

      const id = feature.properties?.id
      const point = pointsRef.current.find((p) => String(p.id) === String(id))
      if (!point) return

      const alreadySelected = String(selectedIdRef.current) === String(point.id)
      setSelectedRef.current(point)

      if (alreadySelected && !point.isNested && point.hasPopup) {
        showPointPopup(point)
      }
    }

    const onClusterClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature =
        e.features?.[0] ??
        map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
      const clusterId = feature?.properties?.cluster_id
      if (clusterId == null || !feature) return

      const source = map.getSource('points') as maplibregl.GeoJSONSource
      void source.getClusterExpansionZoom(clusterId).then((zoom) => {
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
        map.easeTo({ center: coords, zoom })
      })
    }

    const onMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!addingPointRef.current || !onAddPointRef.current) return

      const hit = map.queryRenderedFeatures(e.point, {
        layers: ['points', 'picture-points', 'clusters'],
      })
      if (hit.length > 0) return

      onAddPointRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    }

    map.on('load', async () => {
      const initial = splitPointsGeoJSON(pointsRef.current)

      map.addSource('points', {
        type: 'geojson',
        data: initial.clustered,
        cluster: true,
        clusterRadius: CLUSTER_RADIUS_PX,
      })

      map.addSource('picture-points', {
        type: 'geojson',
        data: initial.picture,
      })

      map.addSource(COLLAPSE_POLYGON_SOURCE, {
        type: 'geojson',
        data: collapsePolygonToGeoJSON(collapsePolygonRef.current),
      })

      map.addSource(COLLAPSE_MASK_SOURCE, {
        type: 'geojson',
        data: collapseMaskToGeoJSON(collapsePolygonRef.current),
      })

      await loadMapIcons(map, pointsRef.current)
      iconsReadyRef.current = true

      map.addLayer({
        id: 'clusters',
        type: 'symbol',
        source: 'points',
        filter: ['has', 'point_count'],
        layout: {
          'icon-image': CLUSTER_ICON_ID,
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 14,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': '#374151',
        },
      })

      map.addLayer({
        id: 'points',
        type: 'symbol',
        source: 'points',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['get', 'iconKey'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': ['get', 'iconAnchor'],
        },
      })

      map.addLayer({
        id: 'picture-points',
        type: 'symbol',
        source: 'picture-points',
        layout: {
          'icon-image': ['get', 'iconKey'],
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-anchor': 'center',
        },
      })

      // Cover markers/map outside the nested zone (hole keeps zone contents visible).
      map.addLayer({
        id: COLLAPSE_MASK_FILL,
        type: 'fill',
        source: COLLAPSE_MASK_SOURCE,
        paint: {
          'fill-color': '#0f172a',
          'fill-opacity': 0.45,
        },
      })

      map.addLayer({
        id: COLLAPSE_POLYGON_FILL,
        type: 'fill',
        source: COLLAPSE_POLYGON_SOURCE,
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#3b82f6'],
          'fill-opacity': 0.08,
        },
      })

      map.addLayer({
        id: COLLAPSE_POLYGON_LINE,
        type: 'line',
        source: COLLAPSE_POLYGON_SOURCE,
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
          'line-width': 3,
          'line-opacity': 1,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      })

      map.on('click', 'points', onPointClick)
      map.on('click', 'picture-points', onPointClick)
      map.on('click', 'clusters', onClusterClick)
      map.on('click', onMapClick)
      map.on('mouseenter', 'points', setPointer)
      map.on('mouseleave', 'points', clearPointer)
      map.on('mouseenter', 'picture-points', setPointer)
      map.on('mouseleave', 'picture-points', clearPointer)
      map.on('mouseenter', 'clusters', setPointer)
      map.on('mouseleave', 'clusters', clearPointer)
    })

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
      iconsReadyRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const polygonSrc = map.getSource(COLLAPSE_POLYGON_SOURCE) as maplibregl.GeoJSONSource | undefined
    const maskSrc = map.getSource(COLLAPSE_MASK_SOURCE) as maplibregl.GeoJSONSource | undefined
    if (polygonSrc) polygonSrc.setData(collapsePolygonToGeoJSON(collapsePolygon))
    if (maskSrc) maskSrc.setData(collapseMaskToGeoJSON(collapsePolygon))
  }, [collapsePolygon])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const clusteredSrc = map.getSource('points') as maplibregl.GeoJSONSource | undefined
    const pictureSrc = map.getSource('picture-points') as maplibregl.GeoJSONSource | undefined
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

  const selectedId = selected?.id ?? null

  useEffect(() => {
    if (!mapRef.current) return

    if (!selectedId) {
      closingPopupFromReact.current = true
      popupRef.current?.remove()
      closingPopupFromReact.current = false
      return
    }

    const point = pointsRef.current.find((p) => String(p.id) === String(selectedId))
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

    const popup = popupRef.current
    if (!popup) return

    popup
      .setLngLat([point.coordinates.lng, point.coordinates.lat])
      .setHTML(buildPopupContent(point))
      .addTo(mapRef.current)
  }, [selectedId])

  const selectedPopupKey = (() => {
    if (!selectedId) return null
    const point = points.find((p) => String(p.id) === String(selectedId))
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
  })()

  useEffect(() => {
    if (!selectedPopupKey || !popupRef.current?.isOpen()) return

    const point = pointsRef.current.find((p) => String(p.id) === String(selectedId))
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

  return <div id="map" style={{ height: '100%', width: '100%' }} />
}
