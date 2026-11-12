import { useEffect, useState } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'
import type { MarkerKind } from '@type'

export function useDrawerMode() {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('places')
  const [expanded, setExpanded] = useState(true)
  const [addingPoint, setAddingPoint] = useState(false)
  const [pendingMarkerType, setPendingMarkerType] = useState<MarkerKind | null>(
    null,
  )

  useEffect(() => {
    if (drawerMode) setExpanded(true)
  }, [drawerMode])

  const closeDrawer = () => {
    setDrawerMode(null)
    setAddingPoint(false)
    setPendingMarkerType(null)
    setExpanded(true)
  }

  return {
    drawerMode,
    setDrawerMode,
    expanded,
    minimize: () => setExpanded(false),
    expand: () => setExpanded(true),
    isDrawerExpanded: drawerMode !== null && expanded,
    addingPoint,
    setAddingPoint,
    pendingMarkerType,
    setPendingMarkerType,
    closeDrawer,
  }
}
