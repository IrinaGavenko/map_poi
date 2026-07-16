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
    <div
      className={[
        'app-shell',
        app.drawerOpen ? 'is-drawer-open' : '',
        app.collapseActive ? 'is-collapse-active' : '',
        app.collapseActive && !app.collapseExpanded ? 'is-collapse-minimized' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="app-shell-map">
        <MapView
          points={app.mapPoints}
          selected={app.selected}
          setSelected={app.selectPoint}
          clearSelected={app.clearSelected}
          addingPoint={app.addingPoint}
          onAddPoint={app.addPoint}
          focusRequest={app.mapFocus}
          collapsePolygon={app.collapseSession?.polygon ?? null}
        />
      </div>

      <DatasetSelector value={app.datasetId} onChange={app.handleDatasetChange} />

      <MapLegend
        types={app.legendTypes}
        selectedTypes={app.selectedTypes}
        onTypesChange={app.setSelectedTypes}
      />

      <ControlButtons drawerMode={app.controlDrawerMode} onToggle={app.toggleDrawer} />

      {/* Mount only the active drawer so places + edit never overlap in the DOM. */}
      {app.activePanel === 'places' && (
        <ViewMode
          open
          expanded={app.drawerExpanded}
          onMinimize={app.minimizeDrawer}
          onExpand={app.expandDrawer}
          query={app.query}
          onQueryChange={app.setQuery}
          points={app.points}
          filtered={app.filtered}
          selectedTypes={app.selectedTypes}
          onTypesChange={app.setSelectedTypes}
          selected={app.selected}
          onSelect={app.selectPointFromDrawer}
        />
      )}

      {app.activePanel === 'collapse' && (
        <CollapseView
          open
          expanded={app.collapseExpanded}
          parent={app.collapseSession?.parent ?? null}
          points={app.collapseSession?.nested ?? []}
          selected={app.selected}
          onSelect={app.selectPointFromDrawer}
          onBack={() => app.exitCollapse(true)}
          onClose={() => app.exitCollapse(false)}
          onMinimize={app.minimizeCollapse}
          onExpand={app.expandCollapse}
        />
      )}

      {app.activePanel === 'edit' && (
        <EditMode
          open
          expanded={app.drawerExpanded}
          onMinimize={app.minimizeDrawer}
          onExpand={app.expandDrawer}
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
            app.selectPointFromDrawer(point)
          }}
          addingPoint={app.addingPoint}
          onToggleAdding={() => app.setAddingPoint((active) => !active)}
          onChangePoint={app.updateSelectedPoint}
          onDeletePoint={app.deleteSelectedPoint}
        />
      )}
    </div>
  )
}
