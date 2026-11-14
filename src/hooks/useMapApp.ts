import { useEffect, useMemo, useRef, useState } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'
import {
  categoriesForWorkingDataset,
  downloadDatasetZip,
  readImportFile,
  saveWorkingDataset,
  type ImportResult,
} from '@utils/datasetIo'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import { isMobileViewport } from '@utils/isMobile'
import { useDataset } from './useDataset'
import { usePointFilters } from './usePointFilters'
import { useCollapseSession, type MapFocusRequest } from './useCollapseSession'
import { useDrawerMode } from './useDrawerMode'
import { usePointSelection } from './usePointSelection'

/** Ignore control-button clicks that were meant for a list item under a collapsing drawer. */
const CLICK_GUARD_MS = 450
const PERSIST_DEBOUNCE_MS = 300

export function useMapApp() {
  const dataset = useDataset()
  const collapsesRef = useRef(dataset.collapses)
  collapsesRef.current = dataset.collapses

  const filters = usePointFilters(dataset.points)
  const collapse = useCollapseSession({
    points: dataset.points,
    setPoints: dataset.setPoints,
    getCollapses: () => collapsesRef.current,
  })
  const drawers = useDrawerMode()
  const ignoreToggleUntil = useRef(0)
  const minimizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseActiveRef = useRef(collapse.isActive)
  const drawerModeRef = useRef(drawers.drawerMode)
  const datasetFocusKey = useRef(0)
  const focusedMapRevisionRef = useRef<number | null>(null)
  const initialDrawerAppliedRef = useRef(false)
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
      drawers.setPendingMarkerType(null)
      filters.resetFilters()
      drawers.setDrawerMode(null)
    },
    onCollapsibleSelect: (point, collapseFile) => {
      clearMinimizeTimer()
      collapse.enter(point, collapseFile)
    },
  })

  const stopAddingPoint = () => {
    drawers.setAddingPoint(false)
    drawers.setPendingMarkerType(null)
  }

  // Empty cold start → open load/download (files) drawer once.
  useEffect(() => {
    if (!dataset.ready || initialDrawerAppliedRef.current) return
    initialDrawerAppliedRef.current = true
    if (dataset.points.length === 0) {
      drawers.setDrawerMode('files')
      drawers.expand()
    }
  }, [dataset.ready, dataset.points.length])

  // Recenter when a new map snapshot is applied (boot / import).
  useEffect(() => {
    if (!dataset.ready) return
    collapse.clearSession()
    selection.setSelected(null)
    stopAddingPoint()
    focusedMapRevisionRef.current = null
    setDatasetFocus(null)
  }, [dataset.mapRevision])

  useEffect(() => {
    if (!dataset.ready) return
    if (collapse.isActive) return
    if (dataset.points.length === 0) return
    if (focusedMapRevisionRef.current === dataset.mapRevision) return

    focusedMapRevisionRef.current = dataset.mapRevision
    datasetFocusKey.current += 1
    setDatasetFocus({
      key: datasetFocusKey.current,
      points: dataset.points.map((point) => ({
        lat: point.coordinates.lat,
        lng: point.coordinates.lng,
      })),
      animate: false,
    })
  }, [collapse.isActive, dataset.ready, dataset.mapRevision, dataset.points])

  // Auto-save full working map (skip while nested zone is open).
  useEffect(() => {
    if (!dataset.ready) return
    if (collapse.isActive) return

    const timer = window.setTimeout(() => {
      saveWorkingDataset({
        version: dataset.version,
        meta: dataset.meta,
        pinnedSize: dataset.pinnedSize,
        categories: categoriesForWorkingDataset(),
        points: dataset.points,
        collapses: dataset.collapses,
      })
    }, PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [
    dataset.ready,
    dataset.points,
    dataset.categoriesRevision,
    dataset.meta,
    dataset.pinnedSize,
    dataset.collapses,
    dataset.version,
    collapse.isActive,
  ])

  useEffect(() => () => clearMinimizeTimer(), [])

  const mapFocus = collapse.isActive ? collapse.mapFocus : datasetFocus

  const exitCollapse = (openPlaces: boolean) => {
    if (!collapse.isActive) return
    clearMinimizeTimer()
    collapse.exit()
    selection.setSelected(null)
    stopAddingPoint()
    filters.resetFilters()
    drawers.setDrawerMode(openPlaces ? 'places' : null)
  }

  const toggleDrawer = (mode: Exclude<DrawerMode, null>) => {
    if (Date.now() < ignoreToggleUntil.current) return
    clearMinimizeTimer()

    if (collapse.isActive) {
      if (mode === 'places') {
        collapse.toggleExpanded()
        return
      }
      exitCollapse(false)
      return
    }

    if (drawers.drawerMode === mode) {
      if (!drawers.expanded) {
        drawers.expand()
        return
      }
      drawers.setDrawerMode(null)
      if (mode === 'edit') stopAddingPoint()
      return
    }

    drawers.setDrawerMode(mode)
    drawers.expand()
    if (mode !== 'edit') stopAddingPoint()
  }

  const resetAfterMarkerReplace = () => {
    clearMinimizeTimer()
    focusedMapRevisionRef.current = null
    setDatasetFocus(null)
    selection.setSelected(null)
    filters.resetFilters()
    stopAddingPoint()
    collapse.clearSession()
  }

  const rootPointsForExport = (): Point[] => {
    if (collapse.isActive && collapse.session) {
      return collapse.session.previousPoints
    }
    return dataset.points
  }

  const downloadDataset = () => {
    downloadDatasetZip(
      dataset.getWorkingSnapshot(rootPointsForExport()),
      'map-dataset.zip',
    )
  }

  const importDatasetFile = async (file: File): Promise<ImportResult> => {
    const result = await readImportFile(file)
    if (result.ok === false) return result

    resetAfterMarkerReplace()
    dataset.applyWorkingDataset(result.payload.dataset)
    return result
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

  const activePanel = collapse.isActive
    ? 'collapse'
    : drawers.drawerMode === 'edit'
      ? 'edit'
      : drawers.drawerMode === 'files'
        ? 'files'
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
          : activePanel === 'files' && drawers.expanded
            ? 'files'
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
      selection.addPoint(
        coordinates,
        drawers.pendingMarkerType ?? 'categorized',
      )
      stopAddingPoint()
    },
    drawerMode: drawers.drawerMode,
    drawerExpanded: drawers.expanded,
    setDrawerMode: drawers.setDrawerMode,
    addingPoint: drawers.addingPoint,
    setAddingPoint: drawers.setAddingPoint,
    pendingMarkerType: drawers.pendingMarkerType,
    setPendingMarkerType: drawers.setPendingMarkerType,
    stopAddingPoint,
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
    categoriesRevision: dataset.categoriesRevision,
    bumpCategoriesRevision: dataset.bumpCategoriesRevision,
    downloadDataset,
    importDatasetFile,
    drawerOpen:
      (activePanel === 'places' && drawers.expanded) ||
      (activePanel === 'edit' && drawers.expanded) ||
      (activePanel === 'files' && drawers.expanded) ||
      (activePanel === 'collapse' && collapse.isDrawerExpanded),
  }
}
