# Prompt: Create / edit form for pinned markers

> **Sync:** `src/types/pinned.ts` is the source of truth for this shape. When that file changes, update this prompt to match. See `prompts/README.md`.

Copy everything below the line into a new agent chat.

---

## Goal

Build a **create + edit form** for markers of type **`pinned`** in this Miami Map MVP (React + TypeScript + Vite).

The form must:

1. **Read** a pinned marker from the **working map dataset** (`points[]` / zip `markers.json`).
2. **Display** editable fields matching **`src/types/pinned.ts`** (`PinnedMarker`).
3. **Validate** those fields (required/optional rules and defaults from the type JSDoc).
4. **Save** a valid pinned marker back into the working dataset `points` array (create = append; edit = replace by `point.id`).

**Source of truth for shape:** `src/types/pinned.ts` (`PinnedMarker`, `PinnedPoint`, `PinnedPointContent`).

## Canonical pinned marker shape (form + persist)

Taken from `src/types/pinned.ts`:

```ts
{
  type: "pinned"                    // fixed at root
  point: {
    id: string                      // e.g. "<prefix>-<place>-<id>"; required, unique
    type: "pinned"                  // fixed on point
    display_picture: string         // marker image on the map (URL/path)
    coordinates: {
      lat: number                   // -90..90
      lng: number                   // -180..180
    }
    // Optional. Popup content when the marker is clicked.
    // null → no popup is displayed
    point_content: null | {
      name: string                  // popup title
      pictures?: string[]           // default []; gallery in description; [] → section hidden
      description?: string | null   // default null; empty/null → section hidden
      link?: string | null          // default null; null → link section hidden
      google_link?: string | null   // optional; if non-empty → Open in Google Maps; else build from coordinates
      includeInCategorySearch?: false | string  // default false; string = category id for filter/legend
      isCollapsible?: boolean       // default false; collapsed with other markers in the same zone
      isNested?: string | null      // default null; exact key into dataset collapses map
    }
  }
}
```

Reference: `src/types/pinned.ts` only for field meaning and nesting. Categories: `src/types/categories.ts`.

## Form UX requirements

### Modes

- **Create**: after the user places a point on the map (or equivalent create action), open the form with pinned defaults and `point.coordinates` from the click. Set `type` / `point.type` to `"pinned"`.
- **Edit**: when an existing pinned marker is selected (`type === "pinned"` / `point.type === "pinned"`), load its fields into the form.

### Fields to show

| Path | UI | Notes |
|------|-----|--------|
| `point.id` | text (or auto-generated, editable) | required |
| `point.display_picture` | URL input | required for map marker image |
| `point.coordinates.lat` / `lng` | display and/or number inputs | required; range-check |
| `point_content` enabled | toggle / checkbox | off → save `point_content: null` (no popup) |
| `point_content.name` | text input | required when content enabled |
| `point_content.description` | textarea | optional; empty → treat as null / hide section |
| `point_content.link` | text input | optional; empty → null |
| `point_content.google_link` | text input | optional; empty → null (fallback: coords) |
| `point_content.pictures` | one or more URL inputs | optional; default `[]` |
| `point_content.includeInCategorySearch` | category select or off | `false` or a category id string |
| `point_content.isCollapsible` | checkbox | default false |
| `point_content.isNested` | text input | optional exact `collapses` key; empty → `null` |
| `type`, `point.type` | hidden / read-only | always `"pinned"` |

Do **not** add flat fields that are not in `PinnedMarker` (`kind`, `shape`, `cluster`, `picture` vs `display_picture` / `pictures`, etc.).

### Validation (client-side, before save)

- Enforce the structure and rules documented in `src/types/pinned.ts` (required nesting, lat/lng ranges, defaults).
- If `point_content` is non-null, require `name`; apply defaults for omitted optionals (`pictures: []`, `includeInCategorySearch: false`, `isCollapsible: false`, `isNested: null`).
- If `includeInCategorySearch` is a string, it must be a valid category id (from the dataset categories). Boolean `true` alone is invalid.
- Block save while invalid; keep draft local until valid commit.

### Save / read wiring

- **Read**: load the working dataset. Find the pinned item in `points[]` by `point.id` (create → new draft).
- **Save**: write the working document with this nested pinned object inserted/updated in `points`. Preserve other points and `collapses` / `meta` / `categories` / `version`.
- Persist via existing localStorage autosave + zip download/import (`datasetIo`).
- Keep TypeScript types in `src/types/pinned.ts` as the gate for this form. Adapt UI `Point` via normalize/serialize without breaking other marker kinds more than necessary.

## Integration constraints

- Fit existing edit drawer patterns under `src/components/Drawer/EditMode/`, or a dedicated pinned form selected by type.
- Reuse map click → create flow but produce a **pinned** default matching the shape above.
- Match existing drawer shared styles; no unrelated redesign.
- Keep TypeScript strict; add JSON Schema validation deps only if needed.

## Out of scope

- Custom and categorized forms (separate prompts).
- Full nested-zone editor (only the `isNested` field on the form).
- Backend / PostgreSQL.

## Done when

- [ ] User can create a pinned marker from the map and fill the form.
- [ ] User can edit an existing pinned marker from the working dataset.
- [ ] Form fields and saved JSON match `src/types/pinned.ts` nesting (`point`, `display_picture`, `point_content`, etc.).
- [ ] Invalid values show errors and do not save.
- [ ] Valid save updates `points[]` in the working dataset with that shape.
- [ ] `type` / `point.type` are always `"pinned"` on save.
