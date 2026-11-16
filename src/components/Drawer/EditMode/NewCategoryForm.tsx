import { useState, type FormEvent } from 'react'
import { DEFAULT_CATEGORY_COLOR } from '@type/categories'
import {
  CATEGORY_ICON_OPTIONS,
  DEFAULT_CATEGORY_ICON_PATH,
  normalizeCategoryIconPath,
} from '@utils/categoryIconAssets'
import {
  DrawerActionButton,
  DrawerActionRow,
} from '../shared/DrawerActionButton'
import { DrawerChip, DrawerChipGroup } from '../shared/DrawerChip'
import DrawerField from '../shared/DrawerField'
import DrawerForm from '../shared/DrawerForm'
import DrawerSectionHeader from '../shared/DrawerSectionHeader'
import './EditMode.css'

export type NewCategoryDraft = {
  name: string
  viewColor: string
  viewIcon: string
}

/** Fixed palette for quick color picks (custom picker stays available below). */
const PRESET_CATEGORY_COLORS = [
  '#0ea5e9',
  '#22c55e',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#6b7280',
] as const

function normalizeHexColor(value: string): string {
  const trimmed = value.trim().toLowerCase()
  if (/^#[0-9a-f]{6}$/.test(trimmed)) return trimmed
  if (/^#[0-9a-f]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed
    return `#${r}${r}${g}${g}${b}${b}`
  }
  return trimmed
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
  const [viewIcon, setViewIcon] = useState(DEFAULT_CATEGORY_ICON_PATH)

  const trimmed = name.trim()
  const canCreate = trimmed.length > 0
  const selectedKey = normalizeCategoryIconPath(viewIcon)
  const selectedColor = normalizeHexColor(viewColor)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canCreate) return
    onCreate({
      name: trimmed,
      viewColor: viewColor.trim() || DEFAULT_CATEGORY_COLOR,
      viewIcon: viewIcon.trim() || DEFAULT_CATEGORY_ICON_PATH,
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
        <div
          className="places-new-category-color-presets"
          role="group"
          aria-label="Preset colors"
        >
          {PRESET_CATEGORY_COLORS.map((color) => {
            const active = selectedColor === color
            return (
              <button
                key={color}
                type="button"
                className={`places-new-category-color-swatch${active ? ' is-active' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={color}
                aria-pressed={active}
                title={color}
                onClick={() => setViewColor(color)}
              />
            )
          })}
        </div>
        <input
          type="color"
          value={selectedColor.startsWith('#') && selectedColor.length === 7
            ? selectedColor
            : DEFAULT_CATEGORY_COLOR}
          onChange={(e) => setViewColor(e.target.value)}
          className="places-new-category-color"
          aria-label="Custom color"
        />
      </DrawerField>

      <DrawerChipGroup label="Icon" aria-label="Category icon">
        {CATEGORY_ICON_OPTIONS.map((option) => {
          const active = normalizeCategoryIconPath(option.path) === selectedKey
          return (
            <DrawerChip
              key={option.id}
              active={active}
              aria-label={option.label}
              title={option.label}
              onClick={() => setViewIcon(option.path)}
            >
              <img
                className="places-new-category-icon-option"
                src={option.url}
                alt=""
                draggable={false}
              />
            </DrawerChip>
          )
        })}
      </DrawerChipGroup>

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
