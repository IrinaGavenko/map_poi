# Needs change / completion

## Bugs

- [ ] Zoom in/out while a popup is open
- [ ] Map moves too fast after a marker click
- [ ] Double-click behavior
- [ ] Exit from the nested area
- [ ] Rerendering and map movements
- [ ] Camera focus updates after reload only

## Requirements (`_README.md`)

- [x] Collapsible pins for zoom (clustering)
- [x] Category filter
- [~] Search by name — works; **no multi-field / multi-option search** yet
- [~] Load / read / download — **full-map zip** (`markers.json`: meta, categories, markers, collapses); load **replaces**; **localStorage** autosave across reload
- [~] Map editor — create/edit/delete exist; **browser persist** (not repo files); **no move/drag**
- [ ] Lazy loading for collapsing zones and popups — collapse uses async load; **no dedicated lazy popup/media strategy**

## Phase 0 - finalize the JSON structure
1. Move categories settings to the dataset and make it customizable
- [x] Categories: `CategoriesDocument` in working dataset / zip (`src/types/categories.ts`)
2. Approve structure for each type of markers (**types** are SoT; no `src/data/`)
- [x] Pinned — `src/types/pinned.ts`
- [x] Custom — `src/types/custom.ts`
- [x] Categorized — `src/types/categorized.ts`
3. Approve the general map document structure
- [x] `MapDataset` / zip `markers.json`
4. JSON validation
- [] JSON validation

### Phase 0.1 -- infrustructure settings
- [x] Add the place to save pictures and read them by url


## Phase 1 — product completeness

- [x] Create point (click map)
- [x] Edit fields (name, types, description, link, image)
- [x] Delete point
- [ ] **Move** point (coords are read-only)
- [~] Nested-location flows — **view/enter/exit** works; **no edit nested set / create collapse**
- [~] Search & filtering — basic; tighten vs “different options for one location”
- [ ] JSON **validation** (current check is only `id` + coordinates)
- [x] **Download** full map as zip (`markers.json` with meta, categories, markers, collapses)
- [x] **Upload** / replace from full-map zip (Files mode)
- [x] Persist working map in **localStorage** across reload (empty cold start)
- [ ] Before load: ask user **merge vs replace** (today always replaces)
- [x] Determine **start user / map position** on empty cold start — **global world view** (`[0, 20]`, zoom `1.5`)
- [ ] Loading / empty / error / **unsaved-change** states (almost none today)
- [ ] Custom-place **priority index** (described in `_README`, not in `Point` type)

## Phase 2 — quality

- [ ] Unit tests
- [ ] E2E tests
- [ ] CI workflow (no `.github/`)
- [ ] Lint/typecheck/build scripts — `eslint.config.js` exists but **eslint not wired in `package.json`**; no `test` / `lint` / `typecheck` scripts
- [ ] Large-dataset / performance profiling
- [ ] Remove or use unused **`terra-draw`** dependency

### Test list (do later)

- [ ] Keep synced: `prompts/create-*-marker-form.md` with `src/types/{pinned,custom,categorized}.ts` — **types** are source of truth (see `prompts/README.md`)
- [ ] Keep synced: category hierarchy (`rootCategoryId`) in `src/types/categories.ts` — legend shows roots only; subcategory badge on categorized markers only

## Phase 3 — portfolio / docs (`_README.md` polish)

- [~] Stable demo — **live URL exists**
- [ ] Screenshots in `_README.md` (`screenshots or demo` placeholder)
- [ ] Launch instructions in `_README.md` (main README has them; portfolio file does not)
- [ ] Architecture section
- [ ] Trade-offs & limitations section
- [ ] JSON example section (empty `<details>`)
- [ ] Real test coverage / performance numbers

## Phase 4 — planned (not started)

- [ ] PostgreSQL data model + API
- [ ] Saved maps + read-only sharing
- [ ] Auth / authorization + API tests
- [ ] Add different shapes or frames for custom markers
- [ ] Component library for the different marker options
- [ ] Animations for nested locations
