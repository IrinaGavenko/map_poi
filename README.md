# Miami Map MVP

Interactive map of points of interest (POIs) for Miami and related FIFA World Cup 2026 locations. Built with React, TypeScript, Vite, and MapLibre GL.

**Live site:** [https://irinagavenko.github.io/map_poi](https://irinagavenko.github.io/map_poi)

---

## Features

### Map

- **Markers** for every point, styled by category (see [Category display](#category-display))
- **Clustering** for pin and icon markers; large “picture” markers stay visible and do not join clusters
- **Popups** with name, category title(s), description, optional media, “More info” link, and Google Maps
- **Basemap:** OpenStreetMap raster tiles
- Click a cluster to zoom in until individual points appear

### Datasets

- Switch maps from the **Select map** control
- Each visible JSON file under `src/data/` (excluding `collapse-*` and `_`-prefixed files) is a dataset
- Current datasets include `miami` and `test`
- Last selected dataset is remembered in `localStorage`

### Filters & legend

- **Map legend** (category chips) filters which types appear on the map
- Same type filters + **search by name** in the places and edit drawers
- Only **known** categories (defined in `POINT_CATEGORIES`) appear in selectors; unknown types still render on the map as a fallback pin

### Places drawer

- Browse and search the current dataset
- Select a place to open its popup (or enter collapse mode if it is collapsible)
- On mobile, selecting a place minimizes the sheet so more of the map is visible

### Edit drawer

- Add points by enabling add mode and clicking the map
- Edit fields for the selected point (name, types, description, link, etc.)
- Delete the selected point
- Changes are **in-memory only** (not written back to JSON)

### Collapsible places (nested map)

Some points (e.g. FIFA Fan Festival) declare nested content via `isCollapsible` (example: `"FF.json"`).

When opened:

1. The main dataset is hidden on the map
2. Nested points from `collapse-FF.json` (or equivalent) are shown
3. An optional **polygon outline** is drawn around the area
4. The map focuses so nested places are in view
5. A **Collapse** drawer shows parent info and a searchable list of nested places
6. **Back** restores the previous map; the legend reflects nested categories while inside

Nested file resolution order for `isCollapsible: "FF.json"`:

1. `collapse-FF.json` (preferred; GitHub Pages–safe)
2. `_FF.json` (legacy)
3. `FF.json`

Nested file shape:

```json
{
  "polygon": {
    "color": "#3b82f6",
    "coordinates": [{ "lat": 25.77, "lng": -80.18 }]
  },
  "points": [ /* Point[] */ ]
}
```

Legacy formats (bare `Point[]`, or a bare coordinate array for the polygon) are still accepted.

### Mobile behavior

- Bottom sheet drawers with expand / minimize (swipe or peek strip)
- Legend stays usable during collapse; layout adapts above the sheet
- Desktop uses a side drawer

---

## Category display

Categories are configured in `src/types/categories.ts` in two layers:

| Layer | Role |
|--------|------|
| **`CATEGORY_TYPE`** | Shared style for a group (`transport`, `fifa`, `global`, …): color + render mode |
| **`POINT_CATEGORIES`** | Concrete ids used on points (`airport`, `fifa_store`, …): emoji/image URL, group, and display **title** |

### Render modes (`CATEGORY_TYPE.type`)

| Mode | Map look | Clusters? | Icon source |
|------|----------|-----------|-------------|
| **`pin`** | Colored pin with emoji | Yes | `POINT_CATEGORIES.icon` (emoji) |
| **`icon`** | Small rectangle with image | Yes | `POINT_CATEGORIES.icon` (image URL) |
| **`picture`** | Large rectangle with image | No | `POINT_CATEGORIES.icon` (image URL) |

FIFA assets live under `public/assets/` and are referenced with `import.meta.env.BASE_URL` so paths work on GitHub Pages (`/map_poi/`).

Point data uses category **ids** in `type[]`; the UI shows **titles** in the legend, filters, and popups.

---

## Point data shape

```ts
type Point = {
  id: string
  name: string
  type: string[]           // category ids, e.g. ["fifa_store"]
  description: string
  icon: string
  picture: string[]
  link: string
  coordinates: { lat: number; lng: number }
  isCollapsible?: string   // e.g. "FF.json" → loads collapse-FF.json
}
```

---

## Project layout

```
src/
  components/     MapView, MapLegend, DatasetSelector, Drawer UI
  hooks/          App orchestration (dataset, filters, collapse, drawers)
  data/           Dataset JSON + collapse-*.json
  types/          Point types + categories.ts
  utils/          GeoJSON, icons, focus, filters, dataset loading
public/assets/    Category images (FIFA store, museum, etc.)
scripts/          Optional data converters (e.g. Excel → JSON)
```

---

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (app is served under base path `/map_poi/`).

```bash
npm run build    # production build → dist/
npm run preview  # preview dist locally
npm run deploy   # build + publish to GitHub Pages (gh-pages)
```

---

## Notes

- Edit-mode changes are not persisted to disk
- Unknown category ids use a gray fallback pin and are omitted from category selectors
- For MapLibre layer details, see `src/components/MapView/README.md`
