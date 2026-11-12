import PointIcon from '@components/PointIcon'
import type { Point } from '@type'
import DrawerSectionHeader from '../shared/DrawerSectionHeader'
import './EditMode.css'

type PlacesSectionProps = {
  points: Point[]
  selected: Point | null
  onSelect: (point: Point) => void
}

export default function PlacesSection({
  points,
  selected,
  onSelect,
}: PlacesSectionProps) {
  return (
    <>
      <DrawerSectionHeader title="Places" bordered />
      <div className="places-list">
        {points.map((p) => (
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
    </>
  )
}
