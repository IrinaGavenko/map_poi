import { filterPoints, getPointTypes } from '@utils/filterPoints'
import type { Point } from '@type'

type PointFilterProps = {
  points: Point[]
  query: string
  selectedTypes: string[]
  onTypesChange: (types: string[]) => void
}

export default function PointFilter({
  points,
  query,
  selectedTypes,
  onTypesChange,
}: PointFilterProps) {
  const filtered = filterPoints(points, query, selectedTypes)
  const availableTypes = getPointTypes(points)
  const hasQuery = query.trim().length > 0
  const hasTypeFilter = selectedTypes.length > 0

  const toggleType = (type: string) => {
    onTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter((t) => t !== type)
        : [...selectedTypes, type],
    )
  }

  return (
    <div
      style={{
        flexShrink: 0,
        marginBottom: 10,
        paddingBottom: 10,
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: '#374151' }}>
        Type
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {availableTypes.map((type) => {
          const active = selectedTypes.includes(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                textTransform: 'capitalize',
                borderRadius: 999,
                border: `1px solid ${active ? '#3b82f6' : '#d1d5db'}`,
                background: active ? '#eff6ff' : '#fff',
                color: active ? '#1d4ed8' : '#4b5563',
                cursor: 'pointer',
              }}
            >
              {type}
            </button>
          )
        })}
      </div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>
        {hasQuery || hasTypeFilter
          ? `${filtered.length} of ${points.length} places`
          : `${points.length} places`}
      </div>
    </div>
  )
}
