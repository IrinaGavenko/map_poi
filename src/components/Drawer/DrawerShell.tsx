import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from 'react'
import { MOBILE_BREAKPOINT } from './constants'

const CLOSE_DISTANCE = 100
const EXPAND_DISTANCE = 40

type DrawerShellProps = {
  open: boolean
  /** Mobile peek strip — session kept, content hidden until expanded. */
  minimized?: boolean
  onClose: () => void
  onExpand?: () => void
  children: ReactNode
}

function isScrollableTouchTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const scrollable = target.closest(
    '.places-list, .places-drawer-body, .places-collapse-parent',
  )
  return Boolean(scrollable && scrollable.scrollTop > 0)
}

export default function DrawerShell({
  open,
  minimized = false,
  onClose,
  onExpand,
  children,
}: DrawerShellProps) {
  const [dragY, setDragY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const startYRef = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const draggingRef = useRef(false)

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const sync = () => setIsMobile(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    setDragY(0)
    dragYRef.current = 0
    startYRef.current = null
    draggingRef.current = false
  }, [open, minimized])

  const onTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (!isMobile || !open) return
    if (!minimized && isScrollableTouchTarget(event.target)) return
    startYRef.current = event.touches[0]?.clientY ?? null
    draggingRef.current = startYRef.current != null
  }

  const onTouchMove = (event: TouchEvent<HTMLElement>) => {
    if (!draggingRef.current || startYRef.current == null) return
    const currentY = event.touches[0]?.clientY
    if (currentY == null) return

    if (minimized) {
      const delta = Math.min(0, currentY - startYRef.current)
      dragYRef.current = delta
      setDragY(delta)
      return
    }

    const delta = Math.max(0, currentY - startYRef.current)
    dragYRef.current = delta
    setDragY(delta)
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    const delta = dragYRef.current
    draggingRef.current = false
    startYRef.current = null
    dragYRef.current = 0
    setDragY(0)

    if (minimized) {
      if (-delta >= EXPAND_DISTANCE) onExpand?.()
      return
    }

    if (delta >= CLOSE_DISTANCE) onClose()
  }

  const style: CSSProperties | undefined =
    open && dragY !== 0
      ? {
          transform: minimized
            ? `translateY(calc(100% - var(--drawer-peek-height) + ${dragY}px))`
            : `translateY(${dragY}px)`,
          transition: 'none',
        }
      : undefined

  return (
    <aside
      aria-hidden={!open}
      className={`places-drawer${open ? ' is-open' : ''}${minimized ? ' is-minimized' : ''}${dragY !== 0 ? ' is-dragging' : ''}`}
      style={style}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={endDrag}
      onTouchCancel={endDrag}
    >
      {children}
    </aside>
  )
}
