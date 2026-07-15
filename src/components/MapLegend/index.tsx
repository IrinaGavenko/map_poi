import { getPointCategoryConfig } from '@type/categories'
import './MapLegend.css'

type MapLegendProps = {
  types: string[]
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
}

export default function MapLegend({
  types,
  selectedTypes,
  onTypesChange,
}: MapLegendProps) {
  const toggleType = (type: string) => {
    onTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type],
    )
  }

  return (
    <div className="map-legend" role="group" aria-label="Filter by type">
      {types.map((type) => {
        const config = getPointCategoryConfig(type)
        const active = selectedTypes.length === 0 || selectedTypes.includes(type)
        return (
          <button
            key={type}
            type="button"
            className={`map-legend-item${active ? ' is-active' : ' is-muted'}`}
            aria-pressed={selectedTypes.includes(type)}
            onClick={() => toggleType(type)}
          >
            <span className="map-legend-icon" aria-hidden>
              {config.icon}
            </span>
            <span className="map-legend-label">{type}</span>
          </button>
        )
      })}
    </div>
  )
}
