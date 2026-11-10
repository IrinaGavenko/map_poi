import {
  getCategoryImageUrl,
  getCategoryListIcon,
  getCategoryTitle,
  getCategoryVisualMode,
} from '@type/categories'
import { resolvePointCategoryConfig } from '@utils/pointIcons'
import { resolvePublicUrl } from '@utils/publicUrl'
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
        const config = resolvePointCategoryConfig(type)
        const visualMode = getCategoryVisualMode(type)
        const imageUrl = getCategoryImageUrl(type)
        const resolvedImage = imageUrl ? resolvePublicUrl(imageUrl) : undefined
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
              {(visualMode === 'picture' || visualMode === 'icon') && resolvedImage ? (
                <img
                  className="map-legend-picture"
                  src={resolvedImage}
                  alt=""
                  draggable={false}
                  style={{ borderColor: config.color }}
                />
              ) : (
                getCategoryListIcon(type)
              )}
            </span>
            <span className="map-legend-label">{getCategoryTitle(type)}</span>
          </button>
        )
      })}
    </div>
  )
}
