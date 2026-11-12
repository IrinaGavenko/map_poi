import { getCategoryTitle } from '@type/categories'
import type { MarkerKind, Point } from '@type'
import { DrawerChip, DrawerChipGroup } from './DrawerChip'
import DrawerCoords from './DrawerCoords'
import DrawerField from './DrawerField'
import DrawerForm from './DrawerForm'
import { usePointDraft } from './usePointDraft'
import './shared.css'

type MarkerFormProps = {
  markerType: MarkerKind
  point: Point
  availableTypes: string[]
  onChange: (point: Point) => void
  className?: string
}

/** Shared create/edit fields for a placed marker. */
export default function MarkerForm({
  markerType,
  point,
  availableTypes,
  onChange,
  className,
}: MarkerFormProps) {
  const { draft, draftRef, scheduleCommit, flushCommit } = usePointDraft(
    point,
    onChange,
  )

  if (!draft) return null

  const typeOptions = [
    ...new Set([...availableTypes, ...draft.categories]),
  ].sort()

  const toggleCategory = (categoryId: string) => {
    const current = draftRef.current?.categories ?? []
    const nextTypes = current.includes(categoryId)
      ? current.filter((t) => t !== categoryId)
      : [...current, categoryId]
    if (markerType === 'categorized' && nextTypes.length === 0) return
    scheduleCommit({
      categories: nextTypes,
      primaryCategoryId: nextTypes[0] ?? null,
    })
  }

  return (
    <DrawerForm className={className}>
      <DrawerField
        label="Name"
        value={draft.name}
        onChange={(e) => scheduleCommit({ name: e.target.value })}
        onBlur={flushCommit}
      />
      <DrawerField
        as="textarea"
        label="Description"
        value={draft.description}
        onChange={(e) => scheduleCommit({ description: e.target.value })}
        onBlur={flushCommit}
        rows={3}
      />

      {(markerType === 'pinned' || markerType === 'custom') && (
        <DrawerField
          label="Display picture"
          value={draft.displayPicture ?? ''}
          onChange={(e) =>
            scheduleCommit({
              displayPicture: e.target.value.trim() || null,
            })
          }
          onBlur={flushCommit}
          placeholder="https://..."
        />
      )}

      {(markerType === 'categorized' || markerType === 'custom') && (
        <DrawerChipGroup
          label={markerType === 'categorized' ? 'Categories' : 'Category'}
          aria-label="Categories"
        >
          {typeOptions.map((categoryId) => (
            <DrawerChip
              key={categoryId}
              active={draft.categories.includes(categoryId)}
              onClick={() => toggleCategory(categoryId)}
            >
              {getCategoryTitle(categoryId)}
            </DrawerChip>
          ))}
        </DrawerChipGroup>
      )}

      <DrawerField
        label="Link"
        value={draft.link}
        onChange={(e) => scheduleCommit({ link: e.target.value })}
        onBlur={flushCommit}
      />

      {markerType === 'categorized' && (
        <DrawerField
          label="Image link"
          value={draft.pictures[0] ?? ''}
          onChange={(e) => {
            const url = e.target.value
            scheduleCommit({
              pictures: url
                ? [url, ...(draftRef.current?.pictures.slice(1) ?? [])]
                : [],
            })
          }}
          onBlur={flushCommit}
          placeholder="https://..."
        />
      )}

      <DrawerCoords lat={draft.coordinates.lat} lng={draft.coordinates.lng} />
    </DrawerForm>
  )
}

export function markerEditorTitle(
  markerType: MarkerKind,
  mode: 'create' | 'edit',
): string {
  const kind =
    markerType === 'pinned'
      ? 'pinned'
      : markerType === 'custom'
        ? 'custom'
        : 'categorized'
  return mode === 'create' ? `New ${kind} marker` : `Edit ${kind} marker`
}
