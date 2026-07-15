import { useEffect, useRef, useState } from 'react'
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

  const typeOptions = [...new Set([...availableTypes, ...draft.type])].sort()

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

  const scheduleCommit = (next: Point) => {
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
    const current = draftRef.current.type
    const nextTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    if (nextTypes.length === 0) return
    scheduleCommit({ ...draftRef.current, type: nextTypes })
  }

  return (
    <div className="places-edit-form">
      <label>
        Name
        <input
          value={draft.name}
          onChange={(e) => scheduleCommit({ ...draftRef.current, name: e.target.value })}
          onBlur={flushCommit}
        />
      </label>
      <label>
        Description
        <textarea
          value={draft.description}
          onChange={(e) => scheduleCommit({ ...draftRef.current, description: e.target.value })}
          onBlur={flushCommit}
          rows={3}
        />
      </label>
      <div className="places-edit-types">
        <span className="places-edit-types-label">Type</span>
        <div className="places-edit-types-chips" role="group" aria-label="Place types">
          {typeOptions.map((type) => {
            const active = draft.type.includes(type)
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
          onChange={(e) => scheduleCommit({ ...draftRef.current, link: e.target.value })}
          onBlur={flushCommit}
        />
      </label>
      <label>
        Image link
        <input
          value={draft.picture[0] ?? ''}
          onChange={(e) => {
            const url = e.target.value
            scheduleCommit({
              ...draftRef.current,
              picture: url ? [url, ...draftRef.current.picture.slice(1)] : [],
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
