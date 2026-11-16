import { getCategoryTitle } from '@type/categories'
import type { MarkerKind, Point } from '@type'
import { DrawerActionButton } from './DrawerActionButton'
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

  const pictureRows =
    draft.pictures.length > 0 ? draft.pictures : ([''] as string[])

  const commitPictures = (next: string[]) => {
    scheduleCommit({ pictures: next })
  }

  const updatePictureAt = (index: number, value: string) => {
    const base =
      (draftRef.current?.pictures.length ?? 0) > 0
        ? [...(draftRef.current?.pictures ?? [])]
        : ['']
    while (base.length <= index) base.push('')
    base[index] = value
    commitPictures(base)
  }

  const addPictureRow = () => {
    const base = [...(draftRef.current?.pictures ?? [])]
    commitPictures([...base, ''])
  }

  const removePictureAt = (index: number) => {
    const base = [...(draftRef.current?.pictures ?? [])]
    if (base.length === 0) {
      commitPictures([])
      return
    }
    base.splice(index, 1)
    commitPictures(base)
  }

  const flushPictures = () => {
    const cleaned = (draftRef.current?.pictures ?? [])
      .map((url) => url.trim())
      .filter(Boolean)
    scheduleCommit({ pictures: cleaned })
    flushCommit()
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

      <DrawerField as="custom" label="Popup photos">
        <div className="places-popup-photos">
          {pictureRows.map((url, index) => (
            <div key={`popup-photo-${index}`} className="places-popup-photos-row">
              <input
                className="places-popup-photos-input"
                value={url}
                onChange={(e) => updatePictureAt(index, e.target.value)}
                onBlur={flushPictures}
                placeholder="https://..."
                aria-label={`Popup photo ${index + 1}`}
              />
              <button
                type="button"
                className="places-popup-photos-remove"
                aria-label={`Remove photo ${index + 1}`}
                onClick={() => {
                  removePictureAt(index)
                  flushPictures()
                }}
              >
                Remove
              </button>
            </div>
          ))}
          <DrawerActionButton onClick={addPictureRow}>
            + Add photo
          </DrawerActionButton>
        </div>
      </DrawerField>

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
