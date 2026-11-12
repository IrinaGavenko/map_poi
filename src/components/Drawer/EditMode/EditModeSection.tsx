import { DrawerActionButton } from '../shared/DrawerActionButton'
import DrawerSectionHeader from '../shared/DrawerSectionHeader'
import './EditMode.css'

type EditModeSectionProps = {
  onStartCreate: () => void
}

export default function EditModeSection({ onStartCreate }: EditModeSectionProps) {
  return (
    <DrawerSectionHeader
      title="Edit mode"
      hint="Select a place to edit, or add a new one on the map."
    >
      <DrawerActionButton onClick={onStartCreate}>
        + Add place on map
      </DrawerActionButton>
    </DrawerSectionHeader>
  )
}
