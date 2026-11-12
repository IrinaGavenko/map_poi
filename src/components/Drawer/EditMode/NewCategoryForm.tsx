import { useState, type FormEvent } from 'react'
import { DEFAULT_CATEGORY_COLOR } from '@type/categories'
import {
  DrawerActionButton,
  DrawerActionRow,
} from '../shared/DrawerActionButton'
import DrawerField from '../shared/DrawerField'
import DrawerForm from '../shared/DrawerForm'
import DrawerSectionHeader from '../shared/DrawerSectionHeader'
import './EditMode.css'

export type NewCategoryDraft = {
  name: string
  viewColor: string
  viewIcon: string
}

type NewCategoryFormProps = {
  onCancel: () => void
  onCreate: (draft: NewCategoryDraft) => void
}

export default function NewCategoryForm({
  onCancel,
  onCreate,
}: NewCategoryFormProps) {
  const [name, setName] = useState('')
  const [viewColor, setViewColor] = useState(DEFAULT_CATEGORY_COLOR)
  const [viewIcon, setViewIcon] = useState('📍')

  const trimmed = name.trim()
  const canCreate = trimmed.length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canCreate) return
    onCreate({
      name: trimmed,
      viewColor: viewColor.trim() || DEFAULT_CATEGORY_COLOR,
      viewIcon: viewIcon.trim() || '📍',
    })
  }

  return (
    <DrawerForm
      as="form"
      className="places-new-category-form"
      onSubmit={handleSubmit}
    >
      <DrawerSectionHeader
        title="New category"
        hint="Create a root category for the legend and place filters."
      />

      <DrawerField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Parks"
        autoFocus
      />

      <DrawerField as="custom" label="Color">
        <input
          type="color"
          value={viewColor}
          onChange={(e) => setViewColor(e.target.value)}
          className="places-new-category-color"
        />
      </DrawerField>

      <DrawerField
        label="Icon"
        value={viewIcon}
        onChange={(e) => setViewIcon(e.target.value)}
        placeholder="Emoji or short label"
      />

      <DrawerActionRow>
        <DrawerActionButton type="submit" disabled={!canCreate}>
          Create category
        </DrawerActionButton>
        <DrawerActionButton variant="cancel" onClick={onCancel}>
          Cancel
        </DrawerActionButton>
      </DrawerActionRow>
    </DrawerForm>
  )
}
