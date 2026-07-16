import { useEffect, useRef } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'
import { isMobileViewport } from '@utils/isMobile'
import { useDataset } from './useDataset'
import { usePointFilters } from './usePointFilters'
import { useCollapseSession } from './useCollapseSession'
import { useDrawerMode } from './useDrawerMode'
import { usePointSelection } from './usePointSelection'

/** Ignore control-button clicks that were meant for a list item under a collapsing drawer. */
const CLICK_GUARD_MS = 450

export function useMapApp() {
  const dataset = useDataset()
  const filters = usePointFilters(dataset.points)
  const collapse = useCollapseSession({
    points: dataset.points,
    setPoints: dataset.setPoints,
  })
  const drawers = useDrawerMode()
  const ignoreToggleUntil = useRef(0)
  const minimizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseActiveRef = useRef(collapse.isActive)
  const drawerModeRef = useRef(drawers.drawerMode)
  collapseActiveRef.current = collapse.isActive
  drawerModeRef.current = drawers.drawerMode

  const clearMinimizeTimer = () => {
    if (minimizeTimer.current != null) {
      clearTimeout(minimizeTimer.current)
      minimizeTimer.current = null
    }
  }

  const scheduleMinimize = () => {
    if (!isMobileViewport()) return
    clearMinimizeTimer()
    ignoreToggleUntil.current = Date.now() + CLICK_GUARD_MS
    minimizeTimer.current = setTimeout(() => {
      minimizeTimer.current = null
      if (collapseActiveRef.current) collapse.minimize()
      else if (drawerModeRef.current) drawers.minimize()
    }, 50)
  }

  const selection = usePointSelection({
    setPoints: dataset.setPoints,
    onBeforeCollapse: () => {
      clearMinimizeTimer()
      drawers.setAddingPoint(false)
      filters.resetFilters()
      drawers.setDrawerMode(null)
    },
    onCollapsibleSelect: (point, collapseFile) => {
      clearMinimizeTimer()
      void collapse.enter(point, collapseFile)
    },
  })

  useEffect(() => {
    collapse.clearSession()
    selection.setSelected(null)
    drawers.setAddingPoint(false)
    drawers.setDrawerMode(null)
  }, [dataset.datasetId])

  useEffect(() => () => clearMinimizeTimer(), [])

  const exitCollapse = (openPlaces: boolean) => {
    if (!collapse.isActive) return
    clearMinimizeTimer()
    collapse.exit()
    selection.setSelected(null)
    drawers.setAddingPoint(false)
    // Never open edit from collapse exit — only places or nothing.
    drawers.setDrawerMode(openPlaces ? 'places' : null)
  }

  const toggleDrawer = (mode: 'places' | 'edit') => {
    if (Date.now() < ignoreToggleUntil.current) return
    clearMinimizeTimer()

    if (collapse.isActive) {
      if (mode === 'places') {
        collapse.toggleExpanded()
        return
      }
      // Exit nested view only — edit requires another explicit ✎ tap.
      exitCollapse(false)
      return
    }

    if (drawers.drawerMode === mode) {
      if (!drawers.expanded) {
        drawers.expand()
        return
      }
      drawers.setDrawerMode(null)
      if (mode === 'edit') drawers.setAddingPoint(false)
      return
    }

    // Switching places ↔ edit replaces the other (single drawerMode).
    drawers.setDrawerMode(mode)
    drawers.expand()
    if (mode !== 'edit') drawers.setAddingPoint(false)
  }

  const handleDatasetChange = (nextId: string) => {
    clearMinimizeTimer()
    dataset.changeDataset(nextId)
    selection.setSelected(null)
    filters.resetFilters()
    drawers.setAddingPoint(false)
    collapse.clearSession()
  }

  const selectPointFromDrawer = (point: Point) => {
    const isCollapsible =
      typeof point.isCollapsible === 'string' && point.isCollapsible.trim()

    selection.selectPoint(point)

    if (!isCollapsible) scheduleMinimize()
  }

  const minimizeDrawer = () => {
    if (collapse.isActive) collapse.minimize()
    else drawers.minimize()
  }

  const expandDrawer = () => {
    if (collapse.isActive) collapse.expand()
    else drawers.expand()
  }

  // Exactly one panel can be "primary" for controls.
  const activePanel = collapse.isActive
    ? 'collapse'
    : drawers.drawerMode === 'edit'
      ? 'edit'
      : drawers.drawerMode === 'places'
        ? 'places'
        : null

  const controlDrawerMode: DrawerMode =
    activePanel === 'collapse'
      ? collapse.isDrawerExpanded
        ? 'places'
        : null
      : activePanel === 'places' && drawers.expanded
        ? 'places'
        : activePanel === 'edit' && drawers.expanded
          ? 'edit'
          : null

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
    clearSelected: () => selection.setSelected(null),
    selectPointFromDrawer,
    updateSelectedPoint: selection.updateSelectedPoint,
    deleteSelectedPoint: selection.deleteSelectedPoint,
    addPoint: (coordinates: { lat: number; lng: number }) => {
      selection.addPoint(coordinates)
      drawers.setAddingPoint(false)
    },
    drawerMode: drawers.drawerMode,
    drawerExpanded: drawers.expanded,
    setDrawerMode: drawers.setDrawerMode,
    addingPoint: drawers.addingPoint,
    setAddingPoint: drawers.setAddingPoint,
    toggleDrawer,
    closeEditDrawer: drawers.closeDrawer,
    minimizeDrawer,
    expandDrawer,
    collapseSession: collapse.session,
    collapseExpanded: collapse.expanded,
    collapseActive: collapse.isActive,
    collapseDrawerExpanded: collapse.isDrawerExpanded,
    activePanel,
    controlDrawerMode,
    mapFocus: collapse.mapFocus,
    minimizeCollapse: collapse.minimize,
    expandCollapse: collapse.expand,
    exitCollapse,
    handleDatasetChange,
    drawerOpen:
      (activePanel === 'places' && drawers.expanded) ||
      (activePanel === 'edit' && drawers.expanded) ||
      (activePanel === 'collapse' && collapse.isDrawerExpanded),
  }
}
