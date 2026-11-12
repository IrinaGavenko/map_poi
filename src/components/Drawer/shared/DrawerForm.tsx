import type { FormHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import './shared.css'

type DrawerFormDivProps = {
  as?: 'div'
  children: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

type DrawerFormFormProps = {
  as: 'form'
  children: ReactNode
} & Omit<FormHTMLAttributes<HTMLFormElement>, 'children'>

export type DrawerFormProps = DrawerFormDivProps | DrawerFormFormProps

export default function DrawerForm(props: DrawerFormProps) {
  if (props.as === 'form') {
    const { as: _as, children, className, ...rest } = props
    return (
      <form
        className={['places-edit-form', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </form>
    )
  }

  const { as: _as, children, className, ...rest } = props
  return (
    <div
      className={['places-edit-form', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
