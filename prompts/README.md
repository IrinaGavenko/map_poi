# Marker form prompts — main instruction

## Source of truth

These JSON files are the **source of truth** for marker structure:

| Marker type   | Structure file                         | Form prompt |
|---------------|----------------------------------------|-------------|
| pinned        | `src/data/example_pinned.json`         | `create-pinned-marker-form.md` |
| custom        | `src/data/example_custom.json`         | `create-custom-marker-form.md` |
| categorized   | `src/data/example_categorized.json`    | `create-categorized-marker-form.md` |

Comment keys (`"//…"`) in those files are documentation only and are not persisted.

`example_general.json` and `example_validation.json` must follow the same per-type shapes when they embed or validate markers. If they disagree with an `example_<type>.json`, **update general/validation to match the example** — do not change the form prompts to match an outdated general/validation shape.

## Mandatory sync rule

**Every time** any `src/data/example_pinned.json`, `example_custom.json`, or `example_categorized.json` is updated (fields added/removed/renamed, nesting changed, defaults or validation comments changed):

1. Update the matching prompt under `prompts/` so its **canonical shape**, field table, validation rules, and done-when checklist match the JSON.
2. Update this README table if files are renamed or types are added.
3. Align `example_general.json` / `example_validation.json` with the new example shape when those files are in scope.

Do not leave prompts describing a structure that no longer matches their `example_<>.json`.
