import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { buildIconImageExpression, CLUSTER_ICON_ID, getPointIconConfig, loadMapIcons } from '@utils/pointIcons'
import { toGeoJSON } from '@utils/toGeoJSON'
import type { Point } from '@type'
import './MapView.css'

type MapViewProps = {
  points: Point[]
  selected: Point | null
  setSelected: (point: Point) => void
  addingPoint?: boolean
  onAddPoint?: (coordinates: { lat: number; lng: number }) => void
}

function buildPopupContent(point: Point): string {
  const { color, icon } = getPointIconConfig(point)
  const { lat, lng } = point.coordinates
  const categories = point.type
    .map(
      (type) =>
        `<span class="map-popup-tag" style="--popup-accent:${color}">${type}</span>`,
    )
    .join('')
  const image = point.picture[0]
    ? `<div class="map-popup-media"><img class="map-popup-image" src="${point.picture[0]}" alt="" /></div>`
    : `<div class="map-popup-media map-popup-media--empty" style="--popup-accent:${color}"></div>`
  const moreInfo = point.link
    ? `<a class="map-popup-link" href="${point.link}" target="_blank" rel="noopener noreferrer">
        <span class="map-popup-link-icon" aria-hidden>↗</span>
        More info
      </a>`
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
          <span class="map-popup-icon" aria-hidden style="background:${color}">${icon}</span>
          <div class="map-popup-heading-text">
            <h3 class="map-popup-title">${point.name}</h3>
            <div class="map-popup-tags">${categories}</div>
          </div>
        </div>
        <p class="map-popup-description">${point.description}</p>
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
  addingPoint = false,
  onAddPoint,
}: MapViewProps) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const pointsRef = useRef(points)
  const addingPointRef = useRef(addingPoint)
  const onAddPointRef = useRef(onAddPoint)

  useEffect(() => {
    pointsRef.current = points
  }, [points])

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
      maxWidth: '300px',
      className: 'place-popup',
      anchor: 'center',
      offset: 0,
    })
    popupRef.current = popup

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

      const id = feature.properties?.id as string
      const point = pointsRef.current.find((p) => p.id === id)
      if (!point) return

      setSelected(point)
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
        layers: ['points', 'clusters'],
      })
      if (hit.length > 0) return

      onAddPointRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    }

    map.on('load', async () => {
      map.addSource('points', {
        type: 'geojson',
        data: toGeoJSON(pointsRef.current),
        cluster: true,
        clusterRadius: 40,
      })

      await loadMapIcons(map)

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
          'icon-image': buildIconImageExpression(),
          'icon-size': 1,
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
        },
      })

      map.on('click', 'points', onPointClick)
      map.on('click', 'clusters', onClusterClick)
      map.on('click', onMapClick)
      map.on('mouseenter', 'points', setPointer)
      map.on('mouseleave', 'points', clearPointer)
      map.on('mouseenter', 'clusters', setPointer)
      map.on('mouseleave', 'clusters', clearPointer)
    })

    return () => {
      popup.remove()
      map.remove()
      mapRef.current = null
      popupRef.current = null
    }
  }, [setSelected])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('points') as maplibregl.GeoJSONSource | undefined
    if (!src) return

    const active = document.activeElement
    const shouldRestore =
      active instanceof HTMLElement &&
      (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
      !map.getContainer().contains(active)

    src.setData(toGeoJSON(points))

    if (shouldRestore) {
      active.focus({ preventScroll: true })
    }
  }, [points])

  const selectedId = selected?.id ?? null

  useEffect(() => {
    if (!mapRef.current) return

    if (!selectedId) {
      popupRef.current?.remove()
      return
    }

    const point = pointsRef.current.find((p) => p.id === selectedId)
    if (!point) {
      popupRef.current?.remove()
      return
    }

    mapRef.current.flyTo({
      center: [point.coordinates.lng, point.coordinates.lat],
      zoom: 14,
    })

    const popup = popupRef.current
    if (!popup) return

    popup
      .setLngLat([point.coordinates.lng, point.coordinates.lat])
      .setHTML(buildPopupContent(point))
      .addTo(mapRef.current)
  }, [selectedId])

  useEffect(() => {
    if (!selectedId || !popupRef.current?.isOpen()) return

    const point = pointsRef.current.find((p) => p.id === selectedId)
    if (!point) return

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
  }, [points, selectedId])

  return <div id="map" style={{ height: '100%', width: '100%' }} />
}
