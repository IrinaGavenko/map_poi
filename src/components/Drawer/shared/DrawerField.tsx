import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import './shared.css'

type DrawerFieldBase = {
  label: string
  children?: ReactNode
}

type DrawerTextFieldProps = DrawerFieldBase & {
  as?: 'input'
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'children'>

type DrawerTextAreaFieldProps = DrawerFieldBase & {
  as: 'textarea'
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>

type DrawerCustomFieldProps = DrawerFieldBase & {
  as: 'custom'
}

export type DrawerFieldProps =
  | DrawerTextFieldProps
  | DrawerTextAreaFieldProps
  | DrawerCustomFieldProps

export default function DrawerField(props: DrawerFieldProps) {
  const { label } = props

  if (props.as === 'custom') {
    return (
      <label>
        {label}
        {props.children}
      </label>
    )
  }

  if (props.as === 'textarea') {
    const { as: _as, label: _label, children: _children, ...rest } = props
    return (
      <label>
        {label}
        <textarea {...rest} />
      </label>
    )
  }

  const { as: _as, label: _label, children: _children, ...rest } = props
  return (
    <label>
      {label}
      <input {...rest} />
    </label>
  )
}
