import { useEffect } from 'react'
import { useDataset } from './useDataset'
import { usePointFilters } from './usePointFilters'
import { useCollapseSession } from './useCollapseSession'
import { useDrawerMode } from './useDrawerMode'
import { usePointSelection } from './usePointSelection'

export function useMapApp() {
  const dataset = useDataset()
  const filters = usePointFilters(dataset.points)
  const collapse = useCollapseSession({
    points: dataset.points,
    setPoints: dataset.setPoints,
  })
  const drawers = useDrawerMode()
  const selection = usePointSelection({
    setPoints: dataset.setPoints,
    onBeforeCollapse: () => {
      drawers.setAddingPoint(false)
      filters.resetFilters()
    },
    onCollapsibleSelect: (point, collapseFile) => {
      void collapse.enter(point, collapseFile).then(() => {
        drawers.setDrawerMode(null)
      })
    },
  })

  useEffect(() => {
    collapse.clearSession()
    selection.setSelected(null)
    drawers.setAddingPoint(false)
  }, [dataset.datasetId])

  const exitCollapse = (openPlaces: boolean) => {
    if (!collapse.isActive) return
    collapse.exit()
    selection.setSelected(null)
    drawers.setAddingPoint(false)
    drawers.setDrawerMode(openPlaces ? 'places' : null)
  }

  const toggleDrawer = (mode: 'places' | 'edit') => {
    if (collapse.isActive) {
      if (mode === 'places') {
        collapse.toggleExpanded()
        return
      }
      exitCollapse(false)
      drawers.setDrawerMode(mode)
      return
    }

    const next = drawers.drawerMode === mode ? null : mode
    if (next !== 'edit') drawers.setAddingPoint(false)
    drawers.setDrawerMode(next)
  }

  const handleDatasetChange = (nextId: string) => {
    dataset.changeDataset(nextId)
    selection.setSelected(null)
    filters.resetFilters()
    drawers.setAddingPoint(false)
    collapse.clearSession()
  }

  return {
    datasetId: dataset.datasetId,
    points: dataset.points,
    mapPoints: collapse.isActive ? dataset.points : filters.filtered,
    filtered: filters.filtered,
    availableTypes: filters.availableTypes,
    query: filters.query,
    setQuery: filters.setQuery,
    selectedTypes: filters.selectedTypes,
    setSelectedTypes: filters.setSelectedTypes,
    selected: selection.selected,
    selectPoint: selection.selectPoint,
    updateSelectedPoint: selection.updateSelectedPoint,
    deleteSelectedPoint: selection.deleteSelectedPoint,
    addPoint: (coordinates: { lat: number; lng: number }) => {
      selection.addPoint(coordinates)
      drawers.setAddingPoint(false)
    },
    drawerMode: drawers.drawerMode,
    setDrawerMode: drawers.setDrawerMode,
    addingPoint: drawers.addingPoint,
    setAddingPoint: drawers.setAddingPoint,
    toggleDrawer,
    closeEditDrawer: drawers.closeDrawer,
    collapseSession: collapse.session,
    collapseExpanded: collapse.expanded,
    collapseActive: collapse.isActive,
    collapseDrawerExpanded: collapse.isDrawerExpanded,
    mapFocus: collapse.mapFocus,
    minimizeCollapse: collapse.minimize,
    expandCollapse: collapse.expand,
    exitCollapse,
    handleDatasetChange,
    drawerOpen: drawers.drawerMode !== null || collapse.isDrawerExpanded,
  }
}
