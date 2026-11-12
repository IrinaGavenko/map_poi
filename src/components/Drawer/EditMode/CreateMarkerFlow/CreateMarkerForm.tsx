import { useState } from 'react'
import type { MarkerKind, Point } from '@type'
import {
  DrawerActionButton,
  DrawerActionRow,
} from '../../shared/DrawerActionButton'
import DrawerField from '../../shared/DrawerField'
import MarkerForm, { markerEditorTitle } from '../../shared/MarkerForm'
import DrawerSectionHeader from '../../shared/DrawerSectionHeader'
import '../EditMode.css'

function parseCoordinate(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : null
}

type CreateMarkerFormProps = {
  markerType: MarkerKind
  point: Point | null
  availableTypes: string[]
  onChange: (point: Point) => void
  onPlaceAtCoordinates: (coordinates: { lat: number; lng: number }) => void
  onBack: () => void
  onCancel: () => void
  onDone: () => void
}

export default function CreateMarkerForm({
  markerType,
  point,
  availableTypes,
  onChange,
  onPlaceAtCoordinates,
  onBack,
  onCancel,
  onDone,
}: CreateMarkerFormProps) {
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')
  const [coordsError, setCoordsError] = useState<string | null>(null)

  const submitManualCoordinates = () => {
    const lat = parseCoordinate(manualLat)
    const lng = parseCoordinate(manualLng)
    if (lat === null || lng === null) {
      setCoordsError('Enter valid numeric latitude and longitude.')
      return
    }
    if (lat < -90 || lat > 90) {
      setCoordsError('Latitude must be between -90 and 90.')
      return
    }
    if (lng < -180 || lng > 180) {
      setCoordsError('Longitude must be between -180 and 180.')
      return
    }
    setCoordsError(null)
    onPlaceAtCoordinates({ lat, lng })
  }

  return (
    <div className="places-marker-create">
      <DrawerSectionHeader
        title={markerEditorTitle(markerType, 'create')}
        hint={
          point
            ? 'Fill in the details for your new marker.'
            : 'Tap the map to place the marker, or enter coordinates below.'
        }
      />

      {!point ? (
        <div className="places-marker-create-waiting">
          <div className="places-marker-create-waiting-title">
            Waiting for a map tap…
          </div>
          <div className="places-marker-create-waiting-or">
            or enter coordinates
          </div>
          <div className="places-marker-create-coords">
            <DrawerField
              label="Latitude"
              inputMode="decimal"
              value={manualLat}
              onChange={(e) => {
                setManualLat(e.target.value)
                setCoordsError(null)
              }}
              placeholder="25.76170"
            />
            <DrawerField
              label="Longitude"
              inputMode="decimal"
              value={manualLng}
              onChange={(e) => {
                setManualLng(e.target.value)
                setCoordsError(null)
              }}
              placeholder="-80.19180"
            />
          </div>
          {coordsError && (
            <div className="places-marker-create-coords-error">{coordsError}</div>
          )}
          <DrawerActionButton onClick={submitManualCoordinates}>
            Use coordinates
          </DrawerActionButton>
        </div>
      ) : (
        <MarkerForm
          markerType={markerType}
          point={point}
          availableTypes={availableTypes}
          onChange={onChange}
          className="places-new-category-form"
        />
      )}

      <DrawerActionRow>
        {point ? (
          <DrawerActionButton onClick={onDone}>Done</DrawerActionButton>
        ) : (
          <DrawerActionButton onClick={onBack}>Back</DrawerActionButton>
        )}
        <DrawerActionButton variant="cancel" onClick={onCancel}>
          Cancel
        </DrawerActionButton>
      </DrawerActionRow>
    </div>
  )
}
