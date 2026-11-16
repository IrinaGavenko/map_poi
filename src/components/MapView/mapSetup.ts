import maplibregl from 'maplibre-gl'
import { CLUSTER_ICON_ID, loadMapIcons } from '@utils/pointIcons'
import { CLUSTER_RADIUS_PX, flyToUnclusteredPoints } from '@utils/mapFocus'
import { collapseMaskToGeoJSON, collapsePolygonToGeoJSON } from '@utils/collapsePolygon'
import { PINNED_ICON_SIZE_BY_ZOOM } from '@utils/pinnedSize'
import { splitPointsGeoJSON } from '@utils/toGeoJSON'
import type { CollapsePolygon, Point } from '@type'
import type { MapFocusRequest } from './types'
import {
  CLUSTERS_LAYER,
  COLLAPSE_MASK_FILL,
  COLLAPSE_MASK_SOURCE,
  COLLAPSE_POLYGON_FILL,
  COLLAPSE_POLYGON_LINE,
  COLLAPSE_POLYGON_SOURCE,
  PICTURE_POINTS_LAYER,
  PICTURE_POINTS_SOURCE,
  POINTS_LAYER,
  POINTS_SOURCE,
} from './constants'
import { buildPopupContent } from './popupContent'

export function createMapInstance(containerId: string): maplibregl.Map {
  return new maplibregl.Map({
    container: containerId,
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
      layers: [
        {
          id: 'osm',
          type: 'raster',
          source: 'osm',
          paint: {
            // Soften default OSM color so markers read more clearly.
            'raster-saturation': -0.85,
            'raster-contrast': 0.1,
            'raster-brightness-min': 0.05,
          },
        },
      ],
    },
    // Empty / cold-start camera: world view (focused when points load).
    center: [0, 20],
    zoom: 1.5,
  })
}

export function createPlacePopup(): maplibregl.Popup {
  return new maplibregl.Popup({
    closeButton: true,
    maxWidth: 'min(300px, calc(100vw - 24px))',
    className: 'place-popup',
    anchor: 'center',
    offset: 0,
  })
}

type MapInteractionRefs = {
  pointsRef: { current: Point[] }
  selectedIdRef: { current: string | null }
  addingPointRef: { current: boolean }
  onAddPointRef: { current?: (coordinates: { lat: number; lng: number }) => void }
  setSelectedRef: { current: (point: Point) => void }
  clearSelectedRef: { current: () => void }
  closingPopupFromReact: { current: boolean }
  popupRef: { current: maplibregl.Popup | null }
  mapRef: { current: maplibregl.Map | null }
}

export function showPointPopup(
  point: Point,
  mapRef: { current: maplibregl.Map | null },
  popupRef: { current: maplibregl.Popup | null },
) {
  if (!point.hasPopup) return
  const mapInstance = mapRef.current
  const popupInstance = popupRef.current
  if (!mapInstance || !popupInstance) return

  popupInstance
    .setLngLat([point.coordinates.lng, point.coordinates.lat])
    .setHTML(buildPopupContent(point))
    .addTo(mapInstance)
}

export function bindMapInteractions(map: maplibregl.Map, refs: MapInteractionRefs) {
  const setPointer = () => {
    if (refs.addingPointRef.current) return
    map.getCanvas().style.cursor = 'pointer'
  }
  const clearPointer = () => {
    map.getCanvas().style.cursor = refs.addingPointRef.current ? 'crosshair' : ''
  }

  const onPointClick = (e: maplibregl.MapLayerMouseEvent) => {
    const feature = e.features?.[0]
    if (!feature) return

    const id = feature.properties?.id
    const point = refs.pointsRef.current.find((p) => String(p.id) === String(id))
    if (!point) return

    const alreadySelected = String(refs.selectedIdRef.current) === String(point.id)
    refs.setSelectedRef.current(point)

    if (alreadySelected && !point.isNested && point.hasPopup) {
      showPointPopup(point, refs.mapRef, refs.popupRef)
    }
  }

  const onClusterClick = (e: maplibregl.MapLayerMouseEvent) => {
    const feature =
      e.features?.[0] ??
      map.queryRenderedFeatures(e.point, { layers: [CLUSTERS_LAYER] })[0]
    const clusterId = feature?.properties?.cluster_id
    if (clusterId == null || !feature) return

    const source = map.getSource(POINTS_SOURCE) as maplibregl.GeoJSONSource
    void source.getClusterExpansionZoom(clusterId).then((zoom) => {
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      map.easeTo({ center: coords, zoom })
    })
  }

  const onMapClick = (e: maplibregl.MapMouseEvent) => {
    if (!refs.addingPointRef.current || !refs.onAddPointRef.current) return

    const hit = map.queryRenderedFeatures(e.point, {
      layers: [POINTS_LAYER, PICTURE_POINTS_LAYER, CLUSTERS_LAYER],
    })
    if (hit.length > 0) return

    refs.onAddPointRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng })
  }

  map.on('click', POINTS_LAYER, onPointClick)
  map.on('click', PICTURE_POINTS_LAYER, onPointClick)
  map.on('click', CLUSTERS_LAYER, onClusterClick)
  map.on('click', onMapClick)
  map.on('mouseenter', POINTS_LAYER, setPointer)
  map.on('mouseleave', POINTS_LAYER, clearPointer)
  map.on('mouseenter', PICTURE_POINTS_LAYER, setPointer)
  map.on('mouseleave', PICTURE_POINTS_LAYER, clearPointer)
  map.on('mouseenter', CLUSTERS_LAYER, setPointer)
  map.on('mouseleave', CLUSTERS_LAYER, clearPointer)
}

type LoadMapLayersArgs = {
  map: maplibregl.Map
  points: Point[]
  collapsePolygon: CollapsePolygon | null | undefined
  pendingFocus: MapFocusRequest | null | undefined
}

export async function loadMapSourcesAndLayers({
  map,
  points,
  collapsePolygon,
  pendingFocus,
}: LoadMapLayersArgs): Promise<void> {
  const initial = splitPointsGeoJSON(points)

  map.addSource(POINTS_SOURCE, {
    type: 'geojson',
    data: initial.clustered,
    cluster: true,
    clusterRadius: CLUSTER_RADIUS_PX,
  })

  map.addSource(PICTURE_POINTS_SOURCE, {
    type: 'geojson',
    data: initial.picture,
  })

  map.addSource(COLLAPSE_POLYGON_SOURCE, {
    type: 'geojson',
    data: collapsePolygonToGeoJSON(collapsePolygon),
  })

  map.addSource(COLLAPSE_MASK_SOURCE, {
    type: 'geojson',
    data: collapseMaskToGeoJSON(collapsePolygon),
  })

  await loadMapIcons(map, points)

  if (pendingFocus && pendingFocus.points.length > 0) {
    flyToUnclusteredPoints(map, pendingFocus.points, {
      animate: pendingFocus.animate !== false,
    })
  }

  map.addLayer({
    id: CLUSTERS_LAYER,
    type: 'symbol',
    source: POINTS_SOURCE,
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
    id: POINTS_LAYER,
    type: 'symbol',
    source: POINTS_SOURCE,
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
    id: PICTURE_POINTS_LAYER,
    type: 'symbol',
    source: PICTURE_POINTS_SOURCE,
    layout: {
      'icon-image': ['get', 'iconKey'],
      // pinned_size (feature iconSize) × larger scale when zoomed in close.
      'icon-size': PINNED_ICON_SIZE_BY_ZOOM as maplibregl.ExpressionSpecification,
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
}
