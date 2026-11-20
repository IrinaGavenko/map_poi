# Marker form prompts — main instruction

## Source of truth

TypeScript types under `src/types/` are the **source of truth** for marker and category structure:

| Marker type   | Structure file                 | Form prompt |
|---------------|--------------------------------|-------------|
| pinned        | `src/types/pinned.ts`          | `create-pinned-marker-form.md` |
| custom        | `src/types/custom.ts`          | `create-custom-marker-form.md` |
| categorized   | `src/types/categorized.ts`     | `create-categorized-marker-form.md` |
| categories    | `src/types/categories.ts`      | (category forms / registry) |

There is **no** bundled `src/data/` example JSON. Runtime maps are loaded via zip / localStorage (`datasetIo`); shapes must match these types.

Strict schema (no legacy aliases): categories use `categoryTypes` only; collapse keys match `isNested` exactly; marker wrappers are `{ type, point, … }` only.

## Mandatory sync rule

**Every time** any of `src/types/pinned.ts`, `custom.ts`, `categorized.ts`, or `categories.ts` is updated (fields added/removed/renamed, nesting changed, defaults or JSDoc rules changed):

1. Update the matching prompt under `prompts/` so its **canonical shape**, field table, validation rules, and done-when checklist match the types.
2. Update this README table if files are renamed or types are added.

Do not leave prompts describing a structure that no longer matches `src/types/`.
