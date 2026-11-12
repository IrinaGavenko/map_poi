import { useEffect, useState } from 'react'
import type { MarkerKind, Point } from '@type'
import CreateMarkerForm from './CreateMarkerForm'
import MarkerTypeSelector from './MarkerTypeSelector'
import '../EditMode.css'

type CreateMarkerFlowProps = {
  availableTypes: string[]
  selected: Point | null
  onChangePoint: (point: Point) => void
  onDeletePoint: () => void
  onClearSelected: () => void
  onEnableMapPlace: (type: MarkerKind) => void
  onDisableMapPlace: () => void
  onPlaceAtCoordinates: (coordinates: { lat: number; lng: number }) => void
  onExit: () => void
}

export default function CreateMarkerFlow({
  availableTypes,
  selected,
  onChangePoint,
  onDeletePoint,
  onClearSelected,
  onEnableMapPlace,
  onDisableMapPlace,
  onPlaceAtCoordinates,
  onExit,
}: CreateMarkerFlowProps) {
  const [step, setStep] = useState<'type' | 'form'>('type')
  const [markerType, setMarkerType] = useState<MarkerKind | null>(null)
  const [createdPointId, setCreatedPointId] = useState<string | null>(null)
  const [awaitingMapPlace, setAwaitingMapPlace] = useState(false)

  useEffect(() => {
    if (!awaitingMapPlace || !markerType || !selected) return
    if (selected.markerType !== markerType) return
    setCreatedPointId(selected.id)
    setAwaitingMapPlace(false)
  }, [awaitingMapPlace, markerType, selected])

  const createdPoint =
    createdPointId && selected?.id === createdPointId ? selected : null

  const exitAndCleanup = () => {
    onDisableMapPlace()
    if (createdPointId && selected?.id === createdPointId) {
      onDeletePoint()
    }
    onExit()
  }

  const finishWithoutDeleting = () => {
    onDisableMapPlace()
    onExit()
  }

  if (step === 'type' || !markerType) {
    return (
      <MarkerTypeSelector
        onSelect={(type) => {
          setMarkerType(type)
          setStep('form')
          setCreatedPointId(null)
          setAwaitingMapPlace(true)
          onClearSelected()
          onEnableMapPlace(type)
        }}
        onCancel={exitAndCleanup}
      />
    )
  }

  return (
    <CreateMarkerForm
      markerType={markerType}
      point={createdPoint}
      availableTypes={availableTypes}
      onChange={onChangePoint}
      onPlaceAtCoordinates={onPlaceAtCoordinates}
      onBack={() => {
        onDisableMapPlace()
        if (createdPointId && selected?.id === createdPointId) {
          onDeletePoint()
        }
        setCreatedPointId(null)
        setAwaitingMapPlace(false)
        setMarkerType(null)
        setStep('type')
      }}
      onCancel={exitAndCleanup}
      onDone={finishWithoutDeleting}
    />
  )
}
