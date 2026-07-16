import { MOBILE_BREAKPOINT } from '@components/Drawer/constants'

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
}
