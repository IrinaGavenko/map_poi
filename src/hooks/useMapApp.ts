import { useEffect, useMemo, useRef } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import type { Point } from '@type'
import {
  downloadDatasetZip,
  readImportFile,
  type ImportResult,
} from '@utils/datasetIo'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import { useDataset } from './useDataset'
import { usePointFilters } from './usePointFilters'
import { useCollapseSession } from './useCollapseSession'
import { useDrawerMode } from './useDrawerMode'
import { usePointSelection } from './usePointSelection'
import { useWorkingDatasetPersist } from './mapApp/useWorkingDatasetPersist'
import { useDatasetCamera } from './mapApp/useDatasetCamera'
import { useDrawerChrome } from './mapApp/useDrawerChrome'

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
  const initialDrawerAppliedRef = useRef(false)

  const chromeApiRef = useRef({
    clearMinimizeTimer: () => {},
    scheduleMinimize: () => {},
  })

  const stopAddingPoint = () => {
    drawers.setAddingPoint(false)
    drawers.setPendingMarkerType(null)
  }

  const selection = usePointSelection({
    setPoints: dataset.setPoints,
    onBeforeCollapse: () => {
      chromeApiRef.current.clearMinimizeTimer()
      stopAddingPoint()
      filters.resetFilters()
      drawers.setDrawerMode(null)
    },
    onCollapsibleSelect: (point, collapseFile) => {
      chromeApiRef.current.clearMinimizeTimer()
      collapse.enter(point, collapseFile)
    },
  })

  const { datasetFocus, clearDatasetFocus } = useDatasetCamera({
    ready: dataset.ready,
    mapRevision: dataset.mapRevision,
    points: dataset.points,
    collapseActive: collapse.isActive,
    onMapRevisionChange: () => {
      collapse.clearSession()
      selection.setSelected(null)
      stopAddingPoint()
    },
  })

  const exitCollapse = (openPlaces: boolean) => {
    if (!collapse.isActive) return
    chromeApiRef.current.clearMinimizeTimer()
    collapse.exit()
    selection.setSelected(null)
    stopAddingPoint()
    filters.resetFilters()
    drawers.setDrawerMode(openPlaces ? 'places' : null)
  }

  const chrome = useDrawerChrome({
    collapseActive: collapse.isActive,
    collapseMinimize: collapse.minimize,
    collapseExpand: collapse.expand,
    collapseToggleExpanded: collapse.toggleExpanded,
    drawerMode: drawers.drawerMode,
    drawerExpanded: drawers.expanded,
    setDrawerMode: drawers.setDrawerMode,
    expand: drawers.expand,
    minimize: drawers.minimize,
    stopAddingPoint,
    exitCollapse,
  })
  chromeApiRef.current = {
    clearMinimizeTimer: chrome.clearMinimizeTimer,
    scheduleMinimize: chrome.scheduleMinimize,
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

  useWorkingDatasetPersist(
    {
      ready: dataset.ready,
      version: dataset.version,
      meta: dataset.meta,
      pinnedSize: dataset.pinnedSize,
      points: dataset.points,
      collapses: dataset.collapses,
      categoriesRevision: dataset.categoriesRevision,
    },
    collapse.isActive,
  )

  const mapFocus = collapse.isActive ? collapse.mapFocus : datasetFocus

  const resetAfterMarkerReplace = () => {
    chrome.clearMinimizeTimer()
    clearDatasetFocus()
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
    if (!hasNestedZone) chrome.scheduleMinimize()
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
    toggleDrawer: chrome.toggleDrawer,
    closeEditDrawer: drawers.closeDrawer,
    minimizeDrawer: chrome.minimizeDrawer,
    expandDrawer: chrome.expandDrawer,
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
