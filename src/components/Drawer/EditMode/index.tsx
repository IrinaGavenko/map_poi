import PointFilter from '../PointFilter'
import PointIcon from '@components/PointIcon'
import type { Point } from '@type'
import SearchInput from '../SearchInput'
import DrawerShell from '../DrawerShell'
import '../drawer.css'
import './EditMode.css'
import EditPointForm from './EditPointForm'

type EditModeProps = {
  open: boolean
  onClose: () => void
  query: string
  onQueryChange: (value: string) => void
  points: Point[]
  filtered: Point[]
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
  availableTypes: string[]
  selected: Point | null
  onSelect: (point: Point) => void
  addingPoint: boolean
  onToggleAdding: () => void
  onChangePoint: (point: Point) => void
  onDeletePoint: () => void
}

export default function EditMode({
  open,
  onClose,
  query,
  onQueryChange,
  points,
  filtered,
  selectedTypes,
  onTypesChange,
  availableTypes,
  selected,
  onSelect,
  addingPoint,
  onToggleAdding,
  onChangePoint,
  onDeletePoint,
}: EditModeProps) {
  return (
    <DrawerShell open={open} onClose={onClose}>
      <div className="places-drawer-handle" aria-hidden />
      <SearchInput query={query} onQueryChange={onQueryChange} />
      <PointFilter
        points={points}
        query={query}
        selectedTypes={selectedTypes}
        onTypesChange={onTypesChange}
      />

      <div className="places-drawer-body">
        <div className="places-edit-header">
          <div className="places-edit-title">Edit mode</div>
          <div className="places-edit-hint">
            {addingPoint
              ? 'Tap the map to place a new point.'
              : 'Select a place to edit, or add a new one on the map.'}
          </div>
          <button
            type="button"
            className={`places-edit-action${addingPoint ? ' is-cancel' : ''}`}
            onClick={onToggleAdding}
          >
            {addingPoint ? 'Cancel adding' : '+ Add place on map'}
          </button>
        </div>

        {selected ? (
          <EditPointForm
            key={selected.id}
            point={selected}
            availableTypes={availableTypes}
            onChange={onChangePoint}
            onDelete={onDeletePoint}
          />
        ) : (
          <div className="places-edit-empty">No place selected.</div>
        )}

        <div className="places-edit-section-label">Places</div>
        <div className="places-list">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`places-list-item${selected?.id === p.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(p)}
            >
              <PointIcon point={p} size={28} />
              <span className="places-list-name">{p.name}</span>
              <span className="places-list-chevron" aria-hidden>
                ›
              </span>
            </div>
          ))}
        </div>
      </div>
    </DrawerShell>
  )
}
