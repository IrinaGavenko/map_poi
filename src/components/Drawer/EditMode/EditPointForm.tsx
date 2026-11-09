import { useEffect, useRef, useState } from 'react'
import { applyPointEdits } from '@utils/normalizeMarker'
import type { Point } from '@type'
import './EditMode.css'

type EditPointFormProps = {
  point: Point
  availableTypes: string[]
  onChange: (point: Point) => void
  onDelete: () => void
}

export default function EditPointForm({
  point,
  availableTypes,
  onChange,
  onDelete,
}: EditPointFormProps) {
  const [draft, setDraft] = useState(point)
  const draftRef = useRef(point)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const typeOptions = [...new Set([...availableTypes, ...draft.categories])].sort()

  useEffect(() => {
    setDraft(point)
    draftRef.current = point
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [point.id])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const scheduleCommit = (partial: Partial<Point>) => {
    const next = applyPointEdits(draftRef.current, partial)
    draftRef.current = next
    setDraft(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(draftRef.current)
    }, 250)
  }

  const flushCommit = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    onChange(draftRef.current)
  }

  const toggleType = (type: string) => {
    const current = draftRef.current.categories
    const nextTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    if (nextTypes.length === 0) return
    scheduleCommit({
      categories: nextTypes,
      primaryCategoryId: nextTypes[0] ?? null,
    })
  }

  return (
    <div className="places-edit-form">
      <label>
        Name
        <input
          value={draft.name}
          onChange={(e) => scheduleCommit({ name: e.target.value })}
          onBlur={flushCommit}
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(e) => scheduleCommit({ description: e.target.value })}
          onBlur={flushCommit}
          rows={3}
        />
      </label>
      <div className="places-edit-types">
        <span className="places-edit-types-label">Type</span>
        <div className="places-edit-types-chips" role="group" aria-label="Place types">
          {typeOptions.map((type) => {
            const active = draft.categories.includes(type)
            return (
              <button
                key={type}
                type="button"
                className={`places-edit-type-chip${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => toggleType(type)}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>
      <label>
        Link
        <input
          value={draft.link}
          onChange={(e) => scheduleCommit({ link: e.target.value })}
          onBlur={flushCommit}
        />
      </label>
      <label>
        Image link
        <input
          value={draft.pictures[0] ?? ''}
          onChange={(e) => {
            const url = e.target.value
            scheduleCommit({
              pictures: url ? [url, ...draftRef.current.pictures.slice(1)] : [],
            })
          }}
          onBlur={flushCommit}
          placeholder="https://..."
        />
      </label>
      <div className="places-edit-coords">
        {draft.coordinates.lat.toFixed(5)}, {draft.coordinates.lng.toFixed(5)}
      </div>
      <button type="button" className="places-edit-delete" onClick={onDelete}>
        Delete place
      </button>
    </div>
  )
}
