import type { MarkerKind } from '@type'
import { DrawerActionButton } from '../../shared/DrawerActionButton'
import DrawerSectionHeader from '../../shared/DrawerSectionHeader'
import '../EditMode.css'

const MARKER_TYPE_OPTIONS: {
  type: MarkerKind
  title: string
  description: string
}[] = [
  {
    type: 'pinned',
    title: 'Pinned',
    description:
      'Large picture landmark on the map. Good for hero places and destinations.',
  },
  {
    type: 'custom',
    title: 'Custom',
    description:
      'Marker with its own image or icon and optional category styling.',
  },
  {
    type: 'categorized',
    title: 'Categorized',
    description:
      'Standard pin styled by a category. Best for lists of similar places.',
  },
]

type MarkerTypeSelectorProps = {
  onSelect: (type: MarkerKind) => void
  onCancel: () => void
}

export default function MarkerTypeSelector({
  onSelect,
  onCancel,
}: MarkerTypeSelectorProps) {
  return (
    <div className="places-marker-create">
      <DrawerSectionHeader
        title="New marker"
        hint="Choose a marker type to continue."
      />

      <div className="places-marker-type-list" role="list">
        {MARKER_TYPE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            className="places-marker-type-option"
            role="listitem"
            onClick={() => onSelect(option.type)}
          >
            <span className="places-marker-type-option-title">{option.title}</span>
            <span className="places-marker-type-option-desc">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <DrawerActionButton variant="cancel" onClick={onCancel}>
        Cancel
      </DrawerActionButton>
    </div>
  )
}
