# Prompt: Create / edit form for pinned markers

> **Sync:** `src/data/example_pinned.json` is the source of truth for this shape. When that JSON changes, update this prompt to match. See `prompts/README.md`.

Copy everything below the line into a new agent chat.

---

## Goal

Build a **create + edit form** for markers of type **`pinned`** in this Miami Map MVP (React + TypeScript + Vite).

The form must:

1. **Read** a pinned marker from the **general dataset JSON** (`points[]`).
2. **Display** editable fields matching **`src/data/example_pinned.json`**.
3. **Validate** those fields (required/optional rules and defaults from `example_pinned.json` comments).
4. **Save** a valid pinned marker back into the **general dataset** `points` array (create = append; edit = replace by `point.id`).

**Source of truth for shape:** `src/data/example_pinned.json` — not the flat pinned row currently shown in `example_general.json` / `example_validation.json`. If general/validation still use a different pinned shape, **update them** so a pinned entry in `points[]` is exactly this structure (comment keys like `"//…"` are docs only; do not persist those).

## Canonical pinned marker shape (form + persist)

Taken from `src/data/example_pinned.json` (without `//` comment keys):

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
      includeInCategorySearch?: boolean  // default false; if true, needs a category id from categories
      isCollapsible?: boolean       // default false; collapsed with other markers in the same zone
      isNested?: string | null      // default null; if set, file name of the nested zone
    }
  }
}
```

Reference: `src/data/example_pinned.json` only for field meaning and nesting.

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
| `point_content.pictures` | one or more URL inputs | optional; default `[]` |
| `point_content.includeInCategorySearch` | checkbox | default false |
| `point_content.isCollapsible` | checkbox | default false |
| `point_content.isNested` | text input | optional nested-zone file name; empty → `null` |
| `type`, `point.type` | hidden / read-only | always `"pinned"` |

Do **not** add flat general-schema fields that are not in `example_pinned.json` (`kind`, `shape`, `cluster`, `picture` vs `display_picture` / `pictures`, etc.).

### Validation (client-side, before save)

- Enforce the structure and rules documented in `example_pinned.json` (required nesting, lat/lng ranges, defaults).
- If `point_content` is non-null, require `name`; apply defaults for omitted optionals (`pictures: []`, `includeInCategorySearch: false`, `isCollapsible: false`, `isNested: null`).
- If `includeInCategorySearch` is true, require a valid category id (from the dataset categories) — per the file comment; clarify UX if the field is boolean-only today vs category id.
- Block save while invalid; keep draft local until valid commit.
- Update `example_validation.json` so `$defs` for pinned matches this nested shape; validate against that once aligned.

### Save / read wiring

- **Read**: load the general dataset document. Find the pinned item in `points[]` by `point.id` (create → new draft).
- **Save**: write the full general document with this nested pinned object inserted/updated in `points`. Preserve other points and `collapses` / `meta` / `categories` / `version`.
- Align `example_general.json` so its pinned example uses this same nested object (replace the current flat `kind: "pinned"` row).
- Until file upload exists, keep in-memory general dataset state and support **download JSON** of the edited general document.
- Extend TypeScript types for this pinned shape; gate this form on pinned type. Adapt or narrow today’s flat `Point` usage as needed without breaking other marker kinds more than necessary.

## Integration constraints

- Fit existing edit drawer patterns under `src/components/Drawer/EditMode/` (see `EditPointForm.tsx`), or add a dedicated `PinnedPointForm` selected by type.
- Reuse map click → create flow but produce a **pinned** default matching the shape above.
- Match existing CSS in `EditMode.css` / drawer styles; no unrelated redesign.
- Keep TypeScript strict; add JSON Schema validation deps only if needed.

## Out of scope

- Custom and categorized forms (separate prompts later).
- Full nested-zone editor (only the `isNested` file-name field on the form).
- Backend / PostgreSQL.

## Done when

- [ ] User can create a pinned marker from the map and fill the form.
- [ ] User can edit an existing pinned marker loaded from general JSON.
- [ ] Form fields and saved JSON match `example_pinned.json` nesting (`point`, `display_picture`, `point_content`, etc.).
- [ ] Invalid values show errors and do not save.
- [ ] Valid save updates `points[]` in the general dataset with that shape.
- [ ] `type` / `point.type` are always `"pinned"` on save.
- [ ] `example_general.json` (and validation schema) are updated so pinned entries match `example_pinned.json`.
