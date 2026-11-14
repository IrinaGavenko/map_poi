import './ControlButtons.css'

export type DrawerMode = 'places' | 'edit' | 'files' | null

type ControlButtonsProps = {
  drawerMode: DrawerMode
  onToggle: (mode: Exclude<DrawerMode, null>) => void
}

export default function ControlButtons({ drawerMode, onToggle }: ControlButtonsProps) {
  const drawerOpen = drawerMode !== null

  return (
    <div className={`drawer-control-buttons${drawerOpen ? ' is-drawer-open' : ''}`}>
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
      <button
        type="button"
        className={`drawer-control-button${drawerMode === 'files' ? ' is-active' : ''}`}
        aria-label={
          drawerMode === 'files' ? 'Close dataset files panel' : 'Open dataset files panel'
        }
        aria-expanded={drawerMode === 'files'}
        onClick={() => onToggle('files')}
      >
        ⇄
      </button>
    </div>
  )
}
