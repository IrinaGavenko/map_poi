import { useEffect, useState } from 'react'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import { createPoint } from '@utils/createPoint'
import { getStoredDatasetId, loadDataset, setStoredDatasetId } from '@utils/datasets'
import MapView from '@components/MapView'
import MapLegend from '@components/MapLegend'
import DatasetSelector from '@components/DatasetSelector'
import ViewMode from '@components/Drawer/ViewMode'
import EditMode from '@components/Drawer/EditMode'
import ControlButtons, { type DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'

export default function App() {
  const [datasetId, setDatasetId] = useState(getStoredDatasetId)
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selected, setSelected] = useState<Point | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('places')
  const [editablePoints, setEditablePoints] = useState<Point[]>([])
  const [addingPoint, setAddingPoint] = useState(false)

  useEffect(() => {
    let cancelled = false

    void loadDataset(datasetId).then((points) => {
      if (!cancelled) setEditablePoints(points)
    })

    return () => {
      cancelled = true
    }
  }, [datasetId])

  const filtered = filterPoints(editablePoints, query, selectedTypes)
  const availableTypes = getPointTypes(editablePoints)

  const handleDatasetChange = (nextId: string) => {
    setDatasetId(nextId)
    setStoredDatasetId(nextId)
    setSelected(null)
    setQuery('')
    setSelectedTypes([])
    setAddingPoint(false)
  }

  const toggleDrawer = (mode: Exclude<DrawerMode, null>) => {
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
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView
          points={filtered}
          selected={selected}
          setSelected={setSelected}
          addingPoint={addingPoint}
          onAddPoint={handleAddPoint}
        />
      </div>

      <DatasetSelector value={datasetId} onChange={handleDatasetChange} />

      <MapLegend
        types={availableTypes}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
      />

      <ControlButtons drawerMode={drawerMode} onToggle={toggleDrawer} />

      <ViewMode
        open={drawerMode === 'places'}
        query={query}
        onQueryChange={setQuery}
        points={editablePoints}
        filtered={filtered}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selected={selected}
        onSelect={setSelected}
      />

      <EditMode
        open={drawerMode === 'edit'}
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
          setSelected(point)
        }}
        addingPoint={addingPoint}
        onToggleAdding={() => setAddingPoint((active) => !active)}
        onChangePoint={updateSelectedPoint}
        onDeletePoint={deleteSelectedPoint}
      />
    </div>
  )
}
