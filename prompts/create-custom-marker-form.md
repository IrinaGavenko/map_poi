# Prompt: Create / edit form for custom markers

> **Sync:** `src/data/example_custom.json` is the source of truth for this shape. When that JSON changes, update this prompt to match. See `prompts/README.md`.

Copy everything below the line into a new agent chat.

---

## Goal

Build a **create + edit form** for markers of type **`custom`** in this Miami Map MVP (React + TypeScript + Vite).

The form must:

1. **Read** a custom marker from the **general dataset JSON** (`points[]`).
2. **Display** editable fields matching **`src/data/example_custom.json`**.
3. **Validate** those fields (required/optional rules and defaults from `example_custom.json` comments).
4. **Save** a valid custom marker back into the **general dataset** `points` array (create = append; edit = replace by `point.id`).

**Source of truth for shape:** `src/data/example_custom.json` — not the flat `kind: "custom"` row currently shown in `example_general.json` / `example_validation.json`. If general/validation still use a different custom shape, **update them** so a custom entry in `points[]` is exactly this structure (comment keys like `"//…"` are docs only; do not persist those).

## Canonical custom marker shape (form + persist)

Taken from `src/data/example_custom.json` (without `//` comment keys):

```ts
{
  type: "custom"                    // fixed at root
  point: {
    id: string                      // any unique string; required
    type: "custom"                  // fixed on point

    // Optional, default false.
    // When true, marker can be filtered/searched by category
    // and must set point.category.
    hasCategory?: boolean

    // Required when hasCategory is true: category id from categories.json.
    // Omit / null when hasCategory is false.
    category?: string | null

    // Optional, default null.
    // Null only allowed when hasCategory is false,
    // or the referenced category has no display_picture.
    display_picture?: string | null

    coordinates: {
      lat: number                   // -90..90
      lng: number                   // -180..180
    }
  }

  // Sibling of point (not nested inside point)
  point_content: {
    name: string                    // display / popup title

    // Optional, default []. Gallery in description; [] → section hidden
    pictures?: string[]

    // Optional, default null; empty/null → section hidden
    description?: string | null

    // Optional, default null; null → link section hidden
    link?: string | null

    // Optional. If non-empty → Open in Google Maps; else build from coordinates.
    google_link?: string | null

    // Optional, default false. Collapsed with other markers in the same zone
    isCollapsible?: boolean

    // Integer >= 0. Default 0. Higher wins when two markers are close.
    priority?: number
  }
}
```

Note: `point_content` is a **root sibling** of `point` (unlike pinned, where `point_content` is nested under `point`). There is **no** `isNested` on custom.

Reference: `src/data/example_custom.json` only for field meaning and nesting.

## Form UX requirements

### Modes

- **Create**: after the user places a point on the map (or equivalent create action), open the form with custom defaults and `point.coordinates` from the click. Set `type` / `point.type` to `"custom"`.
- **Edit**: when an existing custom marker is selected (`type === "custom"` / `point.type === "custom"`), load its fields into the form.

### Fields to show

| Path | UI | Notes |
|------|-----|--------|
| `point.id` | text (or auto-generated, editable) | required |
| `point.hasCategory` | checkbox | default false; when true, marker is filterable/searchable by category |
| `point.category` | category select | required when `hasCategory` is true; omit/null otherwise |
| `point.display_picture` | URL input (nullable) | default null; required unless `hasCategory` supplies display art |
| `point.coordinates.lat` / `lng` | display and/or number inputs | required; range-check |
| `point_content.name` | text input | required |
| `point_content.description` | textarea | optional; empty → null |
| `point_content.link` | text input | optional; empty → null |
| `point_content.google_link` | text input | optional; empty → null (fallback: coords) |
| `point_content.pictures` | one or more URL inputs | optional; default `[]` |
| `point_content.isCollapsible` | checkbox | default false |
| `point_content.priority` | number input (integer ≥ 0) | optional; default `0` |
| `type`, `point.type` | hidden / read-only | always `"custom"` |

Do **not** add fields that are not in `example_custom.json` (e.g. flat `kind`, `shape: "rectangle"`, `filterGroup`, nested `point_content` under `point`, `isNested`).

### Validation (client-side, before save)

- Enforce the structure and rules documented in `example_custom.json` (required nesting, lat/lng ranges, defaults).
- `point.id`, `point.coordinates`, and `point_content.name` required.
- Apply defaults for omitted optionals (`hasCategory: false`, `category: null`, `display_picture: null`, `pictures: []`, `description: null`, `link: null`, `isCollapsible: false`, `priority: 0`).
- If `hasCategory` is true: require `point.category` (valid id in categories); marker is included in category filter/search. Do not use `includeInCategorySearch`.
- `display_picture` may be null only when allowed by the `hasCategory` / category rule above.
- `priority` must be an integer ≥ 0 when set.
- Block save while invalid; keep draft local until valid commit.
- Update `example_validation.json` so `$defs` for custom matches this shape; validate against that once aligned.

### Save / read wiring

- **Read**: load the general dataset document. Find the custom item in `points[]` by `point.id` (create → new draft).
- **Save**: write the full general document with this custom object inserted/updated in `points`. Preserve other points and `collapses` / `meta` / `categories` / `version`.
- Align `example_general.json` so its custom example uses this same object (replace the current flat `kind: "custom"` row).
- Until file upload exists, keep in-memory general dataset state and support **download JSON** of the edited general document.
- Keep TypeScript types in `src/types/custom.ts` in sync with this shape; gate this form on custom type. Adapt or narrow today’s flat `Point` usage as needed without breaking other marker kinds more than necessary.

## Integration constraints

- Fit existing edit drawer patterns under `src/components/Drawer/EditMode/` (see `EditPointForm.tsx`), or add a dedicated `CustomPointForm` selected by type.
- Reuse map click → create flow but produce a **custom** default matching the shape above.
- Match existing CSS in `EditMode.css` / drawer styles; no unrelated redesign.
- Keep TypeScript strict; add JSON Schema validation deps only if needed.
- Mirror patterns from the pinned form prompt (`prompts/create-pinned-marker-form.md`) where helpful, but keep shapes separate (`point_content` placement differs).

## Out of scope

- Pinned and categorized forms (separate prompts).
- Full nested-zone editor (only `isCollapsible` boolean on this form).
- Backend / PostgreSQL.

## Done when

- [ ] User can create a custom marker from the map and fill the form.
- [ ] User can edit an existing custom marker loaded from general JSON.
- [ ] Form fields and saved JSON match `example_custom.json` (`point` + root `point_content`, `hasCategory`, `priority`, etc.).
- [ ] Invalid values show errors and do not save.
- [ ] Valid save updates `points[]` in the general dataset with that shape.
- [ ] `type` / `point.type` are always `"custom"` on save.
- [ ] `example_general.json` (and validation schema) are updated so custom entries match `example_custom.json`.
