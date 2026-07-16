import { useEffect, useState, type CSSProperties } from 'react'
import PointIcon from '@components/PointIcon'
import { getPointIconConfig } from '@utils/pointIcons'
import { filterPoints } from '@utils/filterPoints'
import type { Point } from '@type'
import DrawerShell from '../DrawerShell'
import SearchInput from '../SearchInput'
import PointFilter from '../PointFilter'
import '../drawer.css'

type CollapseTab = 'info' | 'places'

type CollapseViewProps = {
  open: boolean
  expanded: boolean
  parent: Point | null
  points: Point[]
  selected: Point | null
  onSelect: (point: Point) => void
  onBack: () => void
  onClose: () => void
  onMinimize: () => void
  onExpand: () => void
}

export default function CollapseView({
  open,
  expanded,
  parent,
  points,
  selected,
  onSelect,
  onBack,
  onClose,
  onMinimize,
  onExpand,
}: CollapseViewProps) {
  const accent = parent ? getPointIconConfig(parent).color : '#6b7280'
  const { lat, lng } = parent?.coordinates ?? { lat: 0, lng: 0 }
  const minimized = open && !expanded

  const [tab, setTab] = useState<CollapseTab>('info')
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  useEffect(() => {
    setTab('info')
    setQuery('')
    setSelectedTypes([])
  }, [parent?.id])

  const filtered = filterPoints(points, query, selectedTypes)

  return (
    <DrawerShell
      open={open}
      minimized={minimized}
      onClose={onMinimize}
      onExpand={onExpand}
    >
      <button
        type="button"
        className="places-drawer-handle places-drawer-handle--button"
        aria-label={minimized ? 'Open nested places' : undefined}
        onClick={minimized ? onExpand : undefined}
      />
      <div className="places-collapse-header">
        <button
          type="button"
          className="places-collapse-back"
          onClick={onBack}
          aria-label="Back to previous places"
        >
          ‹
        </button>
        <h2 className="places-collapse-title">{parent?.name ?? 'Places'}</h2>
        <button
          type="button"
          className="places-collapse-close"
          onClick={onClose}
          aria-label="Close nested places"
        >
          ×
        </button>
      </div>

      <div className="places-collapse-tabs" role="tablist" aria-label="Nested place sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'info'}
          className={`places-collapse-tab${tab === 'info' ? ' is-active' : ''}`}
          onClick={() => setTab('info')}
        >
          Info
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'places'}
          className={`places-collapse-tab${tab === 'places' ? ' is-active' : ''}`}
          onClick={() => setTab('places')}
        >
          Places
        </button>
      </div>

      {tab === 'info' && parent && (
        <div
          className="places-collapse-parent"
          role="tabpanel"
          style={{ '--collapse-accent': accent } as CSSProperties}
        >
          {parent.picture[0] ? (
            <div className="places-collapse-parent-media">
              <img src={parent.picture[0]} alt="" />
            </div>
          ) : null}
          <div className="places-collapse-parent-body">
            <div className="places-collapse-parent-heading">
              <PointIcon point={parent} size={32} />
              <div className="places-collapse-parent-heading-text">
                <h3 className="places-collapse-parent-name">{parent.name}</h3>
                <div className="places-collapse-parent-tags">
                  {parent.type.map((type) => (
                    <span key={type} className="places-collapse-parent-tag">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {parent.description ? (
              <p className="places-collapse-parent-description">{parent.description}</p>
            ) : null}
            <div className="places-collapse-parent-actions">
              {parent.link ? (
                <a
                  className="places-collapse-parent-link"
                  href={parent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span aria-hidden>↗</span>
                  More info
                </a>
              ) : null}
              <a
                className="places-collapse-parent-link places-collapse-parent-link--secondary"
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span aria-hidden>📍</span>
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === 'places' && (
        <>
          <div className="places-collapse-filters">
            <SearchInput query={query} onQueryChange={setQuery} />
            <PointFilter
              points={points}
              query={query}
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
            />
          </div>
          <div className="places-list" role="tabpanel">
            {filtered.map((point, index) => (
              <div
                key={`${point.id}-${index}`}
                className={`places-list-item${selected?.id === point.id ? ' is-selected' : ''}`}
                onClick={() => onSelect(point)}
              >
                <PointIcon point={point} size={28} />
                <span className="places-list-name">{point.name}</span>
                <span className="places-list-chevron" aria-hidden>
                  ›
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </DrawerShell>
  )
}
