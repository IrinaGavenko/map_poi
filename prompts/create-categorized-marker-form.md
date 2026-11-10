# Prompt: Create / edit form for categorized markers

> **Sync:** `src/data/example_categorized.json` is the source of truth for this shape. When that JSON changes, update this prompt to match. See `prompts/README.md`.

Copy everything below the line into a new agent chat.

---

## Goal

Build a **create + edit form** for markers of type **`categorized`** in this Miami Map MVP (React + TypeScript + Vite).

The form must:

1. **Read** a categorized marker from the **general dataset JSON** (`points[]`).
2. **Display** editable fields matching **`src/data/example_categorized.json`**.
3. **Validate** those fields (required/optional rules and defaults from `example_categorized.json` comments).
4. **Save** a valid categorized marker back into the **general dataset** `points` array (create = append; edit = replace by `point.id`).

**Source of truth for shape:** `src/data/example_categorized.json` — not the flat `kind: "categorized"` row currently shown in `example_general.json` / `example_validation.json`. If general/validation still use a different categorized shape, **update them** so a categorized entry in `points[]` is exactly this structure (comment keys like `"//…"` are docs only; do not persist those).

## Canonical categorized marker shape (form + persist)

Taken from `src/data/example_categorized.json` (without `//` comment keys):

```ts
{
  type: "categorized"               // fixed at root
  point: {
    id: string                      // e.g. "<prefix>-<category>-<id>"; required, unique
    type: "categorized"             // fixed on point

    // Non-empty array of category ids from categories.json
    // e.g. ["cafe"] or ["cafe", "museum"]
    categories: string[]

    coordinates: {
      lat: number                   // -90..90
      lng: number                   // -180..180
    }
  }

  // Sibling of point (not nested inside point)
  point_content: {
    name: string                    // display title

    // Optional gallery image URL/path strings for the description UI
    // (not the map pin art — that comes from the category). Use [] if none.
    picture?: string[]

    // Free-text body (address, hours, notes). Can be empty "".
    description?: string

    // URL string, or "" if none.
    link?: string

    // Optional. If non-empty → Open in Google Maps; else build from coordinates.
    google_link?: string | null

    // Integer >= 0. Default 0. Higher wins when two markers are close.
    priority?: number
  }
}
```

Note: `point_content` is a **root sibling** of `point` (same as custom; unlike pinned, where it is nested under `point`). Map marker art comes from the linked **categories** config, not from a `display_picture` on the point. Gallery media uses `picture[]` (singular field name, array value).

Reference: `src/data/example_categorized.json` only for field meaning and nesting. Category definitions: `src/data/example_categories.json` (or the path/object on the general dataset’s `categories`).

## Form UX requirements

### Modes

- **Create**: after the user places a point on the map (or equivalent create action), open the form with categorized defaults and `point.coordinates` from the click. Set `type` / `point.type` to `"categorized"`. Preselect at least one valid category id.
- **Edit**: when an existing categorized marker is selected (`type === "categorized"` / `point.type === "categorized"`), load its fields into the form.

### Fields to show

| Path | UI | Notes |
|------|-----|--------|
| `point.id` | text (or auto-generated, editable) | required |
| `point.categories` | multi-select / chips from categories.json | required; non-empty; each id must exist in categories |
| `point.coordinates.lat` / `lng` | display and/or number inputs | required; range-check |
| `point_content.name` | text input | required |
| `point_content.description` | textarea | optional; allow `""` |
| `point_content.link` | text input | optional; allow `""` |
| `point_content.google_link` | text input | optional; empty → null (fallback: coords) |
| `point_content.picture` | one or more URL inputs | optional gallery; default `[]` |
| `point_content.priority` | number input (integer ≥ 0) | optional; default `0` |
| `type`, `point.type` | hidden / read-only | always `"categorized"` |

Do **not** add fields that are not in `example_categorized.json` (e.g. flat `kind`, legacy `type: string[]` on the point root, `cluster`, `display_picture`, `pictures`, `hasCategory`, `isCollapsible`, `point_content` nested under `point`).

### Validation (client-side, before save)

- Enforce the structure and rules documented in `example_categorized.json` (required nesting, lat/lng ranges, defaults).
- `point.id`, `point.coordinates`, `point_content.name`, and non-empty `point.categories` required.
- Every `categories[]` entry must be a valid category id from the dataset’s categories document.
- `picture` items (if any) must be non-empty strings; default `[]`.
- `description` / `link` may be `""`.
- `priority` must be an integer ≥ 0 when set; default `0`.
- Block save while invalid; keep draft local until valid commit.
- Update `example_validation.json` so `$defs` for categorized matches this shape; validate against that once aligned.

### Save / read wiring

- **Read**: load the general dataset document. Find the categorized item in `points[]` by `point.id` (create → new draft). Resolve category options from the dataset’s `categories` (path or inline).
- **Save**: write the full general document with this categorized object inserted/updated in `points`. Preserve other points and `collapses` / `meta` / `categories` / `version`.
- Align `example_general.json` so its categorized examples use this same object (replace the current flat `kind: "categorized"` rows).
- Until file upload exists, keep in-memory general dataset state and support **download JSON** of the edited general document.
- Keep TypeScript types in `src/types/categorized.ts` in sync with this shape; gate this form on categorized type. Adapt or narrow today’s flat `Point` usage (e.g. legacy `type: string[]`) as needed without breaking other marker kinds more than necessary.

## Integration constraints

- Fit existing edit drawer patterns under `src/components/Drawer/EditMode/` (see `EditPointForm.tsx` — today’s type chips are a starting point for `categories`), or add a dedicated `CategorizedPointForm` selected by type.
- Reuse map click → create flow but produce a **categorized** default matching the shape above.
- Match existing CSS in `EditMode.css` / drawer styles; no unrelated redesign.
- Keep TypeScript strict; add JSON Schema validation deps only if needed.
- Mirror patterns from the pinned / custom form prompts where helpful, but keep shapes separate (`point_content` placement: root sibling, like custom).

## Out of scope

- Pinned and custom forms (separate prompts).
- Editing the categories document itself (only selecting existing category ids on the marker).
- Backend / PostgreSQL.

## Done when

- [ ] User can create a categorized marker from the map and fill the form.
- [ ] User can edit an existing categorized marker loaded from general JSON.
- [ ] Form fields and saved JSON match `example_categorized.json` (`point` + root `point_content`, `categories`, `picture`, `priority`, etc.).
- [ ] Invalid values show errors and do not save (including empty or unknown `categories`).
- [ ] Valid save updates `points[]` in the general dataset with that shape.
- [ ] `type` / `point.type` are always `"categorized"` on save.
- [ ] `example_general.json` (and validation schema) are updated so categorized entries match `example_categorized.json`.
