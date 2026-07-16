import PointFilter from '../PointFilter'
import PointIcon from '@components/PointIcon'
import type { Point } from '@type'
import SearchInput from '../SearchInput'
import DrawerShell from '../DrawerShell'
import '../drawer.css'

type ViewModeProps = {
  open: boolean
  expanded: boolean
  onMinimize: () => void
  onExpand: () => void
  query: string
  onQueryChange: (value: string) => void
  points: Point[]
  filtered: Point[]
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
  selected: Point | null
  onSelect: (point: Point) => void
}

export default function ViewMode({
  open,
  expanded,
  onMinimize,
  onExpand,
  query,
  onQueryChange,
  points,
  filtered,
  selectedTypes,
  onTypesChange,
  selected,
  onSelect,
}: ViewModeProps) {
  const minimized = open && !expanded

  return (
    <DrawerShell
      open={open}
      minimized={minimized}
      onClose={onMinimize}
      onExpand={onExpand}
    >
      <button
        type="button"
        className="places-drawer-handle places-drawer-handle--button"
        aria-label={minimized ? 'Open places' : undefined}
        onClick={minimized ? onExpand : undefined}
      />
      <SearchInput query={query} onQueryChange={onQueryChange} />
      <PointFilter
        points={points}
        query={query}
        selectedTypes={selectedTypes}
        onTypesChange={onTypesChange}
      />
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
    </DrawerShell>
  )
}
