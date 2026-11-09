import { useEffect, useMemo, useRef, useState } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import { isMobileViewport } from '@utils/isMobile'
import { useDataset } from './useDataset'
import { usePointFilters } from './usePointFilters'
import { useCollapseSession, type MapFocusRequest } from './useCollapseSession'
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
  const datasetFocusKey = useRef(0)
  const focusedDatasetIdRef = useRef<string | null>(null)
  const [datasetFocus, setDatasetFocus] = useState<MapFocusRequest | null>(null)
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
    focusedDatasetIdRef.current = null
  }, [dataset.datasetId])

  // Center the map on the loaded dataset once per dataset id (open + switch).
  useEffect(() => {
    if (collapse.isActive) return
    if (dataset.points.length === 0) return
    if (focusedDatasetIdRef.current === dataset.datasetId) return

    focusedDatasetIdRef.current = dataset.datasetId
    datasetFocusKey.current += 1
    setDatasetFocus({
      key: datasetFocusKey.current,
      points: dataset.points.map((point) => point.coordinates),
      animate: false,
    })
  }, [collapse.isActive, dataset.datasetId, dataset.points])

  useEffect(() => () => clearMinimizeTimer(), [])

  const mapFocus = collapse.isActive ? collapse.mapFocus : datasetFocus

  const exitCollapse = (openPlaces: boolean) => {
    if (!collapse.isActive) return
    clearMinimizeTimer()
    collapse.exit()
    selection.setSelected(null)
    drawers.setAddingPoint(false)
    filters.resetFilters()
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
    const hasNestedZone = Boolean(point.isNested?.trim())

    selection.selectPoint(point)

    if (!hasNestedZone) scheduleMinimize()
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

  const legendTypes = useMemo(
    () =>
      collapse.isActive
        ? getPointTypes(collapse.session?.nested ?? [])
        : filters.availableTypes,
    [collapse.isActive, collapse.session?.nested, filters.availableTypes],
  )

  const mapPoints = useMemo(() => {
    if (collapse.isActive) {
      return filterPoints(collapse.session?.nested ?? [], '', filters.selectedTypes)
    }
    return filters.filtered
  }, [collapse.isActive, collapse.session?.nested, filters.selectedTypes, filters.filtered])

  return {
    datasetId: dataset.datasetId,
    points: dataset.points,
    mapPoints,
    filtered: filters.filtered,
    availableTypes: filters.availableTypes,
    legendTypes,
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
    mapFocus,
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
