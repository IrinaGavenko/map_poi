# Needs change / completion

## Bugs

- [ ] Zoom in/out while a popup is open
- [ ] Map moves too fast after a marker click
- [ ] Double-click behavior
- [ ] Exit from the nested area

## Requirements (`_README.md`)

- [x] Collapsible pins for zoom (clustering)
- [x] Category filter
- [~] Search by name — works; **no multi-field / multi-option search** yet
- [~] Load / read / download JSONs — **load bundled only**; **no user upload or download**
- [~] Map editor — create/edit/delete exist; **no persist to JSON**, **no move/drag**
- [ ] Lazy loading for collapsing zones and popups — collapse uses async load; **no dedicated lazy popup/media strategy**

## Phase 0 - finalize the JSON structure
1. Move categories settings to the json and make it customizable
- [] Categories: "categories.json"
2. Approve JSON structure for each type of markers
- [] Pinned
- [] Custom
- [] Categorized
3. Approve the general JSON structure
- [] The general JSON structure
4. JSON validation
- [] JSON validation

### Phase 0.1 -- infrustructure settings
- [] Add the place to save pictures and read them by url


## Phase 1 — product completeness

- [x] Create point (click map)
- [x] Edit fields (name, types, description, link, image)
- [x] Delete point
- [ ] **Move** point (coords are read-only)
- [~] Nested-location flows — **view/enter/exit** works; **no edit nested set / create collapse**
- [~] Search & filtering — basic; tighten vs “different options for one location”
- [ ] JSON **validation** (current check is only `id` + coordinates)
- [ ] **Download** edited dataset as JSON
- [ ] **Upload** / replace from user JSON
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

- [ ] Keep synced: `prompts/create-*-marker-form.md`, `src/data/example_<>.json` (pinned / custom / categorized), and `src/types/{pinned,custom,categorized}.ts` — example JSONs are source of truth; prompts + types must match (see `prompts/README.md`)

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
- [] Add different shapes or frames for custom markers
