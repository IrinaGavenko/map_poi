import { useCallback, useMemo, useState } from 'react'
import {
  expandCategoryFilterIds,
  getCategoryTitle,
  getRootCategoryId,
  upsertCategory,
} from '@type/categories'
import { getPointTypes } from '@utils/filterPoints'
import type { Point } from '@type'
import { DrawerChip, DrawerChipGroup } from '../shared/DrawerChip'
import type { NewCategoryDraft } from './NewCategoryForm'
import './EditMode.css'

/** Places whose root category is in the selected set (OR). Empty selection → all places. */
export function filterByRootCategories(
  points: Point[],
  selectedRootIds: string[],
): Point[] {
  if (selectedRootIds.length === 0) return points
  const matched = new Set(expandCategoryFilterIds(selectedRootIds))
  return points.filter((p) =>
    p.categories.some(
      (id) => matched.has(id) || matched.has(getRootCategoryId(id)),
    ),
  )
}

function slugifyCategoryId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function useRootCategoryFilter(points: Point[]) {
  const [selectedRootIds, setSelectedRootIds] = useState<string[]>([])
  const [extraRoots, setExtraRoots] = useState<string[]>([])

  const availableRoots = useMemo(() => {
    const fromPoints = getPointTypes(points)
    const merged = new Set([...fromPoints, ...extraRoots])
    return [...merged].sort()
  }, [points, extraRoots])

  const filtered = useMemo(
    () => filterByRootCategories(points, selectedRootIds),
    [points, selectedRootIds],
  )

  const toggleRoot = useCallback((rootId: string) => {
    setSelectedRootIds((prev) =>
      prev.includes(rootId)
        ? prev.filter((id) => id !== rootId)
        : [...prev, rootId],
    )
  }, [])

  const createCategory = useCallback((draft: NewCategoryDraft) => {
    const id = slugifyCategoryId(draft.name)
    if (!id) return null

    upsertCategory({
      id,
      name: draft.name,
      type: 'categorized',
      viewColor: draft.viewColor,
      viewIcon: draft.viewIcon,
      categoryListIcon: draft.viewIcon,
    })
    setExtraRoots((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setSelectedRootIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    return id
  }, [])

  return {
    availableRoots,
    selectedRootIds,
    toggleRoot,
    createCategory,
    filtered,
  }
}

type CategoryFilterProps = {
  availableRoots: string[]
  selectedRootIds: string[]
  onToggle: (rootId: string) => void
  onNewCategory: () => void
  creating?: boolean
  filteredCount: number
  totalCount: number
}

export default function CategoryFilter({
  availableRoots,
  selectedRootIds,
  onToggle,
  onNewCategory,
  creating = false,
  filteredCount,
  totalCount,
}: CategoryFilterProps) {
  const hasFilter = selectedRootIds.length > 0

  return (
    <div className="places-category-filter">
      <div className="places-category-filter-title">Categories</div>
      <DrawerChipGroup aria-label="Filter by category">
        {availableRoots.map((rootId) => (
          <DrawerChip
            key={rootId}
            active={selectedRootIds.includes(rootId)}
            disabled={creating}
            onClick={() => onToggle(rootId)}
          >
            {getCategoryTitle(rootId)}
          </DrawerChip>
        ))}
        <DrawerChip
          active={creating}
          disabled={creating}
          onClick={onNewCategory}
        >
          New category
        </DrawerChip>
      </DrawerChipGroup>
      {!creating && (
        <div className="places-category-filter-count">
          {hasFilter
            ? `${filteredCount} of ${totalCount} places`
            : `${totalCount} places`}
        </div>
      )}
    </div>
  )
}
