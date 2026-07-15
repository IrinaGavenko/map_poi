import { DRAWER_WIDTH } from '../constants'
import './ControlButtons.css'

export type DrawerMode = 'places' | 'edit' | null

type ControlButtonsProps = {
  drawerMode: DrawerMode
  onToggle: (mode: Exclude<DrawerMode, null>) => void
}

export default function ControlButtons({ drawerMode, onToggle }: ControlButtonsProps) {
  const drawerOpen = drawerMode !== null

  return (
    <div
      className="drawer-control-buttons"
      style={{ left: drawerOpen ? DRAWER_WIDTH + 6 : 12 }}
    >
      <button
        type="button"
        className={`drawer-control-button${drawerMode === 'places' ? ' is-active' : ''}`}
        aria-label={drawerMode === 'places' ? 'Close places panel' : 'Open places panel'}
        aria-expanded={drawerMode === 'places'}
        onClick={() => onToggle('places')}
      >
        {drawerMode === 'places' ? '‹' : '☰'}
      </button>
      <button
        type="button"
        className={`drawer-control-button${drawerMode === 'edit' ? ' is-active' : ''}`}
        aria-label={drawerMode === 'edit' ? 'Close edit panel' : 'Open edit panel'}
        aria-expanded={drawerMode === 'edit'}
        onClick={() => onToggle('edit')}
      >
        ✎
      </button>
    </div>
  )
}
