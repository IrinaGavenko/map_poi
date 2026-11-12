import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './shared.css'

export type DrawerActionVariant = 'primary' | 'cancel'

type DrawerActionButtonProps = {
  children: ReactNode
  variant?: DrawerActionVariant
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'>

export function DrawerActionButton({
  children,
  variant = 'primary',
  type = 'button',
  ...rest
}: DrawerActionButtonProps) {
  const variantClass = variant === 'cancel' ? ' is-cancel' : ''
  return (
    <button
      type={type}
      className={`places-edit-action${variantClass}`}
      {...rest}
    >
      {children}
    </button>
  )
}

type DrawerActionRowProps = {
  children: ReactNode
}

export function DrawerActionRow({ children }: DrawerActionRowProps) {
  return <div className="places-drawer-actions">{children}</div>
}
