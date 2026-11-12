import type { Point } from '@type'
import {
  DrawerActionButton,
  DrawerActionRow,
} from '../../shared/DrawerActionButton'
import MarkerForm, { markerEditorTitle } from '../../shared/MarkerForm'
import DrawerSectionHeader from '../../shared/DrawerSectionHeader'
import '../EditMode.css'

type EditMarkerFlowProps = {
  point: Point
  availableTypes: string[]
  onChangePoint: (point: Point) => void
  onDeletePoint: () => void
  onExit: () => void
}

export default function EditMarkerFlow({
  point,
  availableTypes,
  onChangePoint,
  onDeletePoint,
  onExit,
}: EditMarkerFlowProps) {
  const exitAfterDelete = () => {
    onDeletePoint()
    onExit()
  }

  return (
    <div className="places-marker-create">
      <DrawerSectionHeader
        title={markerEditorTitle(point.markerType, 'edit')}
        hint="Edit the details for this marker."
      />

      <MarkerForm
        key={point.id}
        markerType={point.markerType}
        point={point}
        availableTypes={availableTypes}
        onChange={onChangePoint}
        className="places-new-category-form"
      />

      <DrawerActionRow>
        <DrawerActionButton onClick={onExit}>Done</DrawerActionButton>
        <DrawerActionButton variant="cancel" onClick={onExit}>
          Cancel
        </DrawerActionButton>
      </DrawerActionRow>

      <DrawerActionButton variant="cancel" onClick={exitAfterDelete}>
        Delete place
      </DrawerActionButton>
    </div>
  )
}
