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

- Working map lives in **localStorage** (autosave) and can be **downloaded / imported as a zip** (`markers.json`) from the Files drawer
- Marker and category shapes are defined in **`src/types/`** (no bundled `src/data/` JSON)
- Empty cold start opens the Files drawer to load a zip

### Filters & legend

- **Map legend** (category chips) filters which types appear on the map
- Same type filters + **search by name** in the places and edit drawers
- Only **known** categories (from the dataset categories document / `src/types/categories.ts`) appear in selectors; unknown types still render on the map as a fallback pin

### Places drawer

- Browse and search the current dataset
- Select a place to open its popup (or enter collapse mode if it is collapsible)
- On mobile, selecting a place minimizes the sheet so more of the map is visible

### Edit drawer

- Add points by enabling add mode and clicking the map
- Edit fields for the selected point (name, types, description, link, etc.)
- Delete the selected point
- Changes autosave to **localStorage**; use Files mode to download/import a zip

### Collapsible places (nested map)

Some points declare a nested zone via **`isNested`** (exact key into the dataset `collapses` map). `isCollapsible` is a separate boolean flag.

When opened:

1. The main dataset is hidden on the map
2. Nested points from `collapses[key]` are shown
3. An optional **polygon outline** is drawn around the area
4. The map focuses so nested places are in view
5. A **Collapse** drawer shows parent info and a searchable list of nested places
6. **Back** restores the previous map; the legend reflects nested categories while inside

Nested collapse shape (see `CollapseDataset` in `src/types/index.ts`):

```ts
{
  polygon: { color: string, coordinates: { lat: number, lng: number }[] } | null
  points: /* Marker wrappers → normalized Point[] */
}
```

### Mobile behavior

- Bottom sheet drawers with expand / minimize (swipe or peek strip)
- Legend stays usable during collapse; layout adapts above the sheet
- Desktop uses a side drawer

---

## Category display

Categories come from the working dataset’s `CategoriesDocument` (`src/types/categories.ts`): each entry has id, name, optional `rootCategoryId` (subcategories), colors/icons, and a marker family (`pinned` | `custom` | `categorized`).

### Render modes (`MarkerVisualMode`)

| Mode | Map look | Clusters? | Typical source |
|------|----------|-----------|----------------|
| **`pin`** | Colored pin + emoji/SVG | Yes | Categorized root categories |
| **`icon`** | Rectangle / square image | Yes | Custom markers |
| **`picture`** | Large photo marker | No | Pinned markers |

FIFA assets live under `public/assets/` and are referenced with `import.meta.env.BASE_URL` so paths work on GitHub Pages (`/map_poi/`).

Points use category **ids**; the UI shows **titles** in the legend, filters, and popups.

---

## Point / marker shapes

**Source of truth:** TypeScript types under `src/types/` (see `prompts/README.md`).

- Disk / zip markers: `PinnedMarker` | `CustomMarker` | `CategorizedMarker`
- Map UI model: `Point` in `src/types/index.ts` (normalized from markers)
- Nested zones: `isNested` string key → `collapses`; `isCollapsible` is a boolean

---

## Project layout

```
src/
  components/     MapView, MapLegend, Drawer UI
  hooks/          App orchestration (dataset, filters, collapse, drawers)
  types/          Marker + category source of truth
  utils/          GeoJSON, icons, focus, filters, datasetIo
public/assets/    Category images (FIFA store, museum, etc.)
prompts/          Form prompts kept in sync with types
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

- Working map autosaves to localStorage; export a zip for a portable copy
- Unknown category ids use a gray fallback pin and are omitted from category selectors
- For MapLibre layer details, see `src/components/MapView/README.md`
