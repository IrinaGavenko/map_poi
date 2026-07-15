import { useEffect, useRef, useState } from 'react'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import { createPoint } from '@utils/createPoint'
import { getStoredDatasetId, loadCollapsePoints, loadDataset, setStoredDatasetId } from '@utils/datasets'
import MapView from '@components/MapView'
import MapLegend from '@components/MapLegend'
import DatasetSelector from '@components/DatasetSelector'
import ViewMode from '@components/Drawer/ViewMode'
import CollapseView from '@components/Drawer/CollapseView'
import EditMode from '@components/Drawer/EditMode'
import ControlButtons, { type DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'

type CollapseSession = {
  parent: Point
  nested: Point[]
  previousPoints: Point[]
}

export default function App() {
  const [datasetId, setDatasetId] = useState(getStoredDatasetId)
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selected, setSelected] = useState<Point | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('places')
  const [editablePoints, setEditablePoints] = useState<Point[]>([])
  const [addingPoint, setAddingPoint] = useState(false)
  const [collapseSession, setCollapseSession] = useState<CollapseSession | null>(null)
  const [mapFocus, setMapFocus] = useState<{
    key: number
    points: { lat: number; lng: number }[]
  } | null>(null)
  const mapFocusKey = useRef(0)
  const editablePointsRef = useRef(editablePoints)
  editablePointsRef.current = editablePoints

  useEffect(() => {
    let cancelled = false

    void loadDataset(datasetId).then((points) => {
      if (!cancelled) {
        setEditablePoints(points)
        setCollapseSession(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [datasetId])

  const filtered = filterPoints(editablePoints, query, selectedTypes)
  const mapPoints = collapseSession ? editablePoints : filtered
  const availableTypes = getPointTypes(editablePoints)
  const drawerOpen = drawerMode !== null || collapseSession !== null

  const handleCollapseBack = () => {
    if (!collapseSession) return
    setEditablePoints(collapseSession.previousPoints)
    setCollapseSession(null)
    setSelected(null)
    setAddingPoint(false)
    setDrawerMode('places')
  }

  const handleSelectPoint = (point: Point) => {
    const collapseFile =
      typeof point.isCollapsible === 'string' ? point.isCollapsible.trim() : ''

    if (collapseFile) {
      setSelected(null)
      setAddingPoint(false)
      setQuery('')
      setSelectedTypes([])
      void loadCollapsePoints(collapseFile).then((nested) => {
        const previousPoints = editablePointsRef.current
        setCollapseSession({
          parent: point,
          nested,
          previousPoints,
        })
        setEditablePoints([
          ...previousPoints.filter((p) => p.id !== point.id),
          ...nested,
        ])
        setDrawerMode(null)
        mapFocusKey.current += 1
        setMapFocus({
          key: mapFocusKey.current,
          points: nested.map((p) => p.coordinates),
        })
      })
      return
    }

    setSelected(point)
  }

  const handleDatasetChange = (nextId: string) => {
    setDatasetId(nextId)
    setStoredDatasetId(nextId)
    setSelected(null)
    setQuery('')
    setSelectedTypes([])
    setAddingPoint(false)
    setCollapseSession(null)
  }

  const toggleDrawer = (mode: Exclude<DrawerMode, null>) => {
    if (collapseSession) {
      setEditablePoints(collapseSession.previousPoints)
      setCollapseSession(null)
      setSelected(null)
      setAddingPoint(false)
      setDrawerMode(mode === 'places' ? 'places' : mode)
      return
    }

    setDrawerMode((current) => {
      const next = current === mode ? null : mode
      if (next !== 'edit') setAddingPoint(false)
      return next
    })
  }

  const updateSelectedPoint = (point: Point) => {
    setSelected(point)
    setEditablePoints((points) => points.map((p) => (p.id === point.id ? point : p)))
  }

  const deleteSelectedPoint = () => {
    if (!selected) return
    const id = selected.id
    setEditablePoints((points) => points.filter((p) => p.id !== id))
    setSelected(null)
  }

  const handleAddPoint = (coordinates: { lat: number; lng: number }) => {
    const point = createPoint(coordinates)
    setEditablePoints((points) => [point, ...points])
    setSelected(point)
    setAddingPoint(false)
  }

  return (
    <div className={`app-shell${drawerOpen ? ' is-drawer-open' : ''}`}>
      <div className="app-shell-map">
        <MapView
          points={mapPoints}
          selected={selected}
          setSelected={handleSelectPoint}
          addingPoint={addingPoint}
          onAddPoint={handleAddPoint}
          focusRequest={mapFocus}
        />
      </div>

      <DatasetSelector value={datasetId} onChange={handleDatasetChange} />

      <MapLegend
        types={availableTypes}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
      />

      <ControlButtons
        drawerMode={collapseSession ? 'places' : drawerMode}
        onToggle={toggleDrawer}
      />

      <ViewMode
        open={drawerMode === 'places' && !collapseSession}
        onClose={() => setDrawerMode(null)}
        query={query}
        onQueryChange={setQuery}
        points={editablePoints}
        filtered={filtered}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selected={selected}
        onSelect={handleSelectPoint}
      />

      <CollapseView
        open={collapseSession !== null}
        parent={collapseSession?.parent ?? null}
        points={collapseSession?.nested ?? []}
        selected={selected}
        onSelect={handleSelectPoint}
        onBack={handleCollapseBack}
      />

      <EditMode
        open={drawerMode === 'edit' && !collapseSession}
        onClose={() => {
          setDrawerMode(null)
          setAddingPoint(false)
        }}
        query={query}
        onQueryChange={setQuery}
        points={editablePoints}
        filtered={filtered}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        availableTypes={availableTypes}
        selected={selected}
        onSelect={(point) => {
          setAddingPoint(false)
          handleSelectPoint(point)
        }}
        addingPoint={addingPoint}
        onToggleAdding={() => setAddingPoint((active) => !active)}
        onChangePoint={updateSelectedPoint}
        onDeletePoint={deleteSelectedPoint}
      />
    </div>
  )
}
