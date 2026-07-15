# MapView

`index.tsx` renders the interactive MapLibre GL map: markers, clusters, popups, selection, and “add point” clicks.

Related files in this folder:

- `MapView.css` — popup card styles (class `place-popup`)
- `README.md` — this guide

Elsewhere in the project:

- `../../utils/toGeoJSON.ts` — converts `Point[]` to GeoJSON for the map source
- `../../utils/pointIcons.ts` — pin images + icon style expression

## Props

| Prop | Type | Purpose |
|------|------|---------|
| `points` | `Point[]` | Places shown on the map (usually the filtered list) |
| `selected` | `Point \| null` | Currently selected place |
| `setSelected` | `(point: Point) => void` | Called when a marker is clicked |
| `addingPoint` | `boolean?` | When `true`, map clicks create a new place |
| `onAddPoint` | `(coords) => void?` | Receives `{ lat, lng }` for a new place |

## How the map is built

1. **Create the map once** in a `useEffect` (empty deps except stable `setSelected`).
2. On `load`, add:
   - GeoJSON **source** `points` with `cluster: true`
   - **clusters** symbol layer (control-button style + count text)
   - **points** symbol layer (unclustered icons)
3. Register click / hover handlers on those layers.
4. **Cleanup** with `map.remove()` and `popup.remove()` on unmount.

Initial center / zoom for Miami:

```ts
center: [-80.2, 25.77], // [lng, lat]
zoom: 11,
```

Basemap is OSM raster tiles; glyphs URL is required for cluster count text.

## Working with MapLibre in this project

### Coordinates

MapLibre expects **`[longitude, latitude]`**, not lat/lng.

```ts
coordinates: [point.coordinates.lng, point.coordinates.lat]
```

### Updating markers

Do **not** recreate the map when `points` change. Update the source:

```ts
const src = map.getSource('points') as maplibregl.GeoJSONSource
src.setData(toGeoJSON(points))
```

`setData` can steal focus from drawer inputs; this component restores focus to `INPUT` / `TEXTAREA` after updates.

### Clustering

- Source options: `cluster: true`, `clusterRadius: 40`
- Cluster features have `point_count` / `point_count_abbreviated`
- Unclustered points use filter `['!', ['has', 'point_count']]`
- Expand a cluster with:

```ts
await source.getClusterExpansionZoom(clusterId)
map.easeTo({ center: coords, zoom })
```

(`getClusterExpansionZoom` returns a **Promise** in MapLibre v4 — no callback.)

### Custom marker icons

Icons are registered with `map.addImage(id, imageData)` via `loadMapIcons(map)` **before** adding the symbol layer.

The points layer picks an image by feature property `iconKey`:

```ts
'icon-image': buildIconImageExpression()
'icon-anchor': 'bottom'  // tip of the pin sits on the coordinate
```

Add or change types in `types/categories.ts` (`POINT_CATEGORIES`), then ensure `toGeoJSON` sets `iconKey`.

### Popups

```ts
const popup = new maplibregl.Popup({
  closeButton: true,
  maxWidth: '300px',
  className: 'place-popup', // styles in MapView.css
  offset: 18,
})
popup.setLngLat([lng, lat]).setHTML(html).addTo(map)
```

HTML is built in `buildPopupContent`. Prefer updating popup content when place data changes, but only call `flyTo` when **`selected.id`** changes — otherwise typing in the edit form steals focus / re-flies the map.

### Clicks: markers vs empty map

Layer clicks (`map.on('click', 'points', ...)`) fire for features. For empty-map clicks (add mode), use `map.on('click', handler)` and ignore hits on marker/cluster layers:

```ts
const hit = map.queryRenderedFeatures(e.point, {
  layers: ['points', 'clusters'],
})
if (hit.length > 0) return
```

### Cursor and edit mode

Keep mutable flags in refs (`addingPointRef`, `pointsRef`) so map event handlers always see current values without re-binding listeners.

- Add mode: `crosshair`
- Hover markers/clusters: `pointer`

### Refs pattern (React + MapLibre)

Store the map, popup, and latest props in refs. Re-creating the map on every React render is expensive and loses view state.

## Common tasks

**Change default view**

Edit `center` / `zoom` in the `new maplibregl.Map({ ... })` call.

**Change cluster look**

Edit `createClusterButtonImageData` in `pointIcons.ts` (matches ControlButtons), or cluster text paint/layout in MapView.

**Change pin size**

Adjust `'icon-size'` on the `points` layer (e.g. `1` → `1.2`).

**Switch basemap**

Replace the `style` object with a MapLibre style URL (e.g. MapTiler) that includes `glyphs` if you keep symbol text.

**Debug clicks / layers**

```ts
map.on('click', (e) => {
  console.log(map.queryRenderedFeatures(e.point))
})
```

## Gotchas

1. **Lng/lat order** — wrong order places markers in the ocean or far away.
2. **Container must have size** — `#map` needs height/width (this app uses `100%` inside a filled absolute parent).
3. **Import CSS** — `maplibre-gl/dist/maplibre-gl.css` is loaded in `main.tsx`; popup styles load via `./MapView.css` from this component.
4. **Avoid flying on every keystroke** — depend on `selectedId`, not the whole `selected` object.
5. **OSM tile usage** — OpenStreetMap tile servers expect reasonable traffic and attribution for production apps.

## Official docs

- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [Style spec (layers, expressions)](https://maplibre.org/maplibre-style-spec/)
