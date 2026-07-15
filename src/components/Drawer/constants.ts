import type { CSSProperties } from 'react'

export const DRAWER_WIDTH = 360

export const drawerStyle = (open: boolean): CSSProperties => ({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  width: DRAWER_WIDTH,
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  minWidth: 0,
  transform: open ? 'translateX(0)' : 'translateX(-120%)',
  transition: 'transform 0.25s ease',
  pointerEvents: open ? 'auto' : 'none',
})
