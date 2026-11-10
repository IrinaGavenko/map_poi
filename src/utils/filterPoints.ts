import {
  expandCategoryFilterIds,
  getCategoriesRegistry,
  getRootCategoryId,
  isRootCategory,
} from '@type/categories'
import type { Point } from '@type'

export const filterPoints = (points: Point[], q: string, types: string[] = []) => {
  const normalized = q.toLowerCase().trim()
  // Legend selects roots; expand so "food" also matches "coffee" subcategories.
  const matchedIds = expandCategoryFilterIds(types)
  const matched = new Set(matchedIds)

  return points.filter((p) => {
    const matchesQuery = !normalized || p.name.toLowerCase().includes(normalized)
    // Empty categories → not in category search → stay visible when type filters are active.
    const matchesType =
      matched.size === 0 ||
      p.categories.length === 0 ||
      p.categories.some((t) => matched.has(t) || matched.has(getRootCategoryId(t)))
    return matchesQuery && matchesType
  })
}

/**
 * Root category ids present in the point set (for legend / filters).
 * Subcategories map up to their root so only roots appear in the list.
 */
export const getPointTypes = (points: Point[]) => {
  const known = getCategoriesRegistry()
  const roots = new Set<string>()

  for (const point of points) {
    for (const id of point.categories) {
      if (!(id in known)) continue
      const rootId = getRootCategoryId(id)
      if (rootId in known && isRootCategory(rootId)) roots.add(rootId)
      else if (isRootCategory(id)) roots.add(id)
    }
  }

  return [...roots].sort()
}
