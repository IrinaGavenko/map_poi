import { useEffect, useState } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'

export function useDrawerMode() {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('places')
  const [expanded, setExpanded] = useState(true)
  const [addingPoint, setAddingPoint] = useState(false)

  useEffect(() => {
    if (drawerMode) setExpanded(true)
  }, [drawerMode])

  const closeDrawer = () => {
    setDrawerMode(null)
    setAddingPoint(false)
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
    closeDrawer,
  }
}
