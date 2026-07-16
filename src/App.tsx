import { useMapApp } from '@hooks'
import MapView from '@components/MapView'
import MapLegend from '@components/MapLegend'
import DatasetSelector from '@components/DatasetSelector'
import ViewMode from '@components/Drawer/ViewMode'
import CollapseView from '@components/Drawer/CollapseView'
import EditMode from '@components/Drawer/EditMode'
import ControlButtons from '@components/Drawer/ControlButtons'

export default function App() {
  const app = useMapApp()

  return (
    <div className={`app-shell${app.drawerOpen ? ' is-drawer-open' : ''}`}>
      <div className="app-shell-map">
        <MapView
          points={app.mapPoints}
          selected={app.selected}
          setSelected={app.selectPoint}
          addingPoint={app.addingPoint}
          onAddPoint={app.addPoint}
          focusRequest={app.mapFocus}
        />
      </div>

      <DatasetSelector value={app.datasetId} onChange={app.handleDatasetChange} />

      <MapLegend
        types={app.availableTypes}
        selectedTypes={app.selectedTypes}
        onTypesChange={app.setSelectedTypes}
      />

      <ControlButtons
        drawerMode={app.collapseDrawerExpanded ? 'places' : app.drawerMode}
        onToggle={app.toggleDrawer}
      />

      <ViewMode
        open={app.drawerMode === 'places' && !app.collapseActive}
        onClose={() => app.setDrawerMode(null)}
        query={app.query}
        onQueryChange={app.setQuery}
        points={app.points}
        filtered={app.filtered}
        selectedTypes={app.selectedTypes}
        onTypesChange={app.setSelectedTypes}
        selected={app.selected}
        onSelect={app.selectPoint}
      />

      <CollapseView
        open={app.collapseActive}
        expanded={app.collapseExpanded}
        parent={app.collapseSession?.parent ?? null}
        points={app.collapseSession?.nested ?? []}
        selected={app.selected}
        onSelect={app.selectPoint}
        onBack={() => app.exitCollapse(true)}
        onClose={() => app.exitCollapse(false)}
        onMinimize={app.minimizeCollapse}
        onExpand={app.expandCollapse}
      />

      <EditMode
        open={app.drawerMode === 'edit' && !app.collapseActive}
        onClose={app.closeEditDrawer}
        query={app.query}
        onQueryChange={app.setQuery}
        points={app.points}
        filtered={app.filtered}
        selectedTypes={app.selectedTypes}
        onTypesChange={app.setSelectedTypes}
        availableTypes={app.availableTypes}
        selected={app.selected}
        onSelect={(point) => {
          app.setAddingPoint(false)
          app.selectPoint(point)
        }}
        addingPoint={app.addingPoint}
        onToggleAdding={() => app.setAddingPoint((active) => !active)}
        onChangePoint={app.updateSelectedPoint}
        onDeletePoint={app.deleteSelectedPoint}
      />
    </div>
  )
}
