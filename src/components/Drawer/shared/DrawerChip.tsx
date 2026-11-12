import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './shared.css'

type DrawerChipProps = {
  active?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export function DrawerChip({
  active = false,
  children,
  type = 'button',
  ...rest
}: DrawerChipProps) {
  return (
    <button
      type={type}
      className={`places-drawer-chip${active ? ' is-active' : ''}`}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  )
}

type DrawerChipGroupProps = {
  label?: string
  'aria-label'?: string
  children: ReactNode
}

export function DrawerChipGroup({
  label,
  'aria-label': ariaLabel,
  children,
}: DrawerChipGroupProps) {
  return (
    <div className="places-drawer-chip-group">
      {label ? <span className="places-drawer-chip-group-label">{label}</span> : null}
      <div
        className="places-drawer-chips"
        role="group"
        aria-label={ariaLabel ?? label}
      >
        {children}
      </div>
    </div>
  )
}
