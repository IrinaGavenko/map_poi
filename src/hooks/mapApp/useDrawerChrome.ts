import { useEffect, useRef } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import { isMobileViewport } from '@utils/isMobile'
import { CLICK_GUARD_MS } from './constants'

type DrawerChromeArgs = {
  collapseActive: boolean
  collapseMinimize: () => void
  collapseExpand: () => void
  collapseToggleExpanded: () => void
  drawerMode: DrawerMode
  drawerExpanded: boolean
  setDrawerMode: (mode: DrawerMode) => void
  expand: () => void
  minimize: () => void
  stopAddingPoint: () => void
  exitCollapse: (openPlaces: boolean) => void
}

/** Mobile minimize click-guard + places/edit/files toggle while collapse may be active. */
export function useDrawerChrome({
  collapseActive,
  collapseMinimize,
  collapseExpand,
  collapseToggleExpanded,
  drawerMode,
  drawerExpanded,
  setDrawerMode,
  expand,
  minimize,
  stopAddingPoint,
  exitCollapse,
}: DrawerChromeArgs) {
  const ignoreToggleUntil = useRef(0)
  const minimizeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const collapseActiveRef = useRef(collapseActive)
  const drawerModeRef = useRef(drawerMode)
  collapseActiveRef.current = collapseActive
  drawerModeRef.current = drawerMode

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
      if (collapseActiveRef.current) collapseMinimize()
      else if (drawerModeRef.current) minimize()
    }, 50)
  }

  useEffect(() => () => clearMinimizeTimer(), [])

  const toggleDrawer = (mode: Exclude<DrawerMode, null>) => {
    if (Date.now() < ignoreToggleUntil.current) return
    clearMinimizeTimer()

    if (collapseActive) {
      if (mode === 'places') {
        collapseToggleExpanded()
        return
      }
      exitCollapse(false)
      return
    }

    if (drawerMode === mode) {
      if (!drawerExpanded) {
        expand()
        return
      }
      setDrawerMode(null)
      if (mode === 'edit') stopAddingPoint()
      return
    }

    setDrawerMode(mode)
    expand()
    if (mode !== 'edit') stopAddingPoint()
  }

  const minimizeDrawer = () => {
    if (collapseActive) collapseMinimize()
    else minimize()
  }

  const expandDrawer = () => {
    if (collapseActive) collapseExpand()
    else expand()
  }

  return {
    clearMinimizeTimer,
    scheduleMinimize,
    toggleDrawer,
    minimizeDrawer,
    expandDrawer,
  }
}
