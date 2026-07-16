import { useState } from 'react'
import type { DrawerMode } from '@components/Drawer/ControlButtons'

export function useDrawerMode() {
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('places')
  const [addingPoint, setAddingPoint] = useState(false)

  const closeDrawer = () => {
    setDrawerMode(null)
    setAddingPoint(false)
  }

  return {
    drawerMode,
    setDrawerMode,
    addingPoint,
    setAddingPoint,
    closeDrawer,
  }
}
