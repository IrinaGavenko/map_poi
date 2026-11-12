import type { ReactNode } from 'react'
import './shared.css'

type DrawerSectionHeaderProps = {
  title: string
  hint?: string
  /** Adds top separator (e.g. Places section). */
  bordered?: boolean
  children?: ReactNode
}

export default function DrawerSectionHeader({
  title,
  hint,
  bordered = false,
  children,
}: DrawerSectionHeaderProps) {
  return (
    <div
      className={`places-edit-header${bordered ? ' places-edit-header--bordered' : ''}`}
    >
      <div className="places-edit-title">{title}</div>
      {hint ? <div className="places-edit-hint">{hint}</div> : null}
      {children}
    </div>
  )
}
