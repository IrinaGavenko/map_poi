import { useState } from 'react'
import type { MarkerKind, Point } from '@type'
import DrawerShell from '../DrawerShell'
import '../drawer.css'
import './EditMode.css'
import CategoryFilter, { useRootCategoryFilter } from './CategoryFilter'
import CreateMarkerFlow from './CreateMarkerFlow/index'
import EditMarkerFlow from './EditMarkerFlow/index'
import EditModeSection from './EditModeSection'
import NewCategoryForm from './NewCategoryForm'
import PlacesSection from './PlacesSection'

type EditModeProps = {
  open: boolean
  expanded: boolean
  onMinimize: () => void
  onExpand: () => void
  points: Point[]
  availableTypes: string[]
  selected: Point | null
  onSelect: (point: Point) => void
  onClearSelected: () => void
  onStartMapPlace: (type: MarkerKind) => void
  onStopMapPlace: () => void
  onPlaceAtCoordinates: (coordinates: { lat: number; lng: number }) => void
  onChangePoint: (point: Point) => void
  onDeletePoint: () => void
}

export default function EditMode({
  open,
  expanded,
  onMinimize,
  onExpand,
  points,
  availableTypes,
  selected,
  onSelect,
  onClearSelected,
  onStartMapPlace,
  onStopMapPlace,
  onPlaceAtCoordinates,
  onChangePoint,
  onDeletePoint,
}: EditModeProps) {
  const minimized = open && !expanded
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingMarker, setCreatingMarker] = useState(false)
  const [editingMarker, setEditingMarker] = useState(false)
  const {
    availableRoots,
    selectedRootIds,
    toggleRoot,
    createCategory,
    filtered,
  } = useRootCategoryFilter(points)

  const startCreatingCategory = () => {
    onStopMapPlace()
    setCreatingMarker(false)
    setEditingMarker(false)
    setCreatingCategory(true)
  }

  const exitCreatingCategory = () => {
    setCreatingCategory(false)
  }

  const startCreatingMarker = () => {
    setCreatingCategory(false)
    setEditingMarker(false)
    setCreatingMarker(true)
  }

  const exitCreatingMarker = () => {
    onStopMapPlace()
    setCreatingMarker(false)
  }

  const startEditingMarker = (point: Point) => {
    onStopMapPlace()
    setCreatingCategory(false)
    setCreatingMarker(false)
    onSelect(point)
    setEditingMarker(true)
  }

  const exitEditingMarker = () => {
    setEditingMarker(false)
  }

  const showMarkerFlow = creatingMarker || (editingMarker && selected)

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
        aria-label={minimized ? 'Open edit panel' : undefined}
        onClick={minimized ? onExpand : undefined}
      />

      {showMarkerFlow ? (
        <div className="places-drawer-body">
          {creatingMarker ? (
            <CreateMarkerFlow
              availableTypes={availableTypes}
              selected={selected}
              onChangePoint={onChangePoint}
              onDeletePoint={onDeletePoint}
              onClearSelected={onClearSelected}
              onEnableMapPlace={onStartMapPlace}
              onDisableMapPlace={onStopMapPlace}
              onPlaceAtCoordinates={onPlaceAtCoordinates}
              onExit={exitCreatingMarker}
            />
          ) : selected ? (
            <EditMarkerFlow
              point={selected}
              availableTypes={availableTypes}
              onChangePoint={onChangePoint}
              onDeletePoint={onDeletePoint}
              onExit={exitEditingMarker}
            />
          ) : null}
        </div>
      ) : (
        <>
          <CategoryFilter
            availableRoots={availableRoots}
            selectedRootIds={selectedRootIds}
            onToggle={toggleRoot}
            onNewCategory={startCreatingCategory}
            creating={creatingCategory}
            filteredCount={filtered.length}
            totalCount={points.length}
          />

          <div className="places-drawer-body">
            {creatingCategory ? (
              <NewCategoryForm
                onCancel={exitCreatingCategory}
                onCreate={(draft) => {
                  createCategory(draft)
                  exitCreatingCategory()
                }}
              />
            ) : (
              <>
                <EditModeSection onStartCreate={startCreatingMarker} />
                <PlacesSection
                  points={filtered}
                  selected={selected}
                  onSelect={startEditingMarker}
                />
              </>
            )}
          </div>
        </>
      )}
    </DrawerShell>
  )
}
