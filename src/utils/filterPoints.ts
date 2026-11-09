import { getCategoriesRegistry } from '@type/categories'
import type { Point } from '@type'

export const filterPoints = (points: Point[], q: string, types: string[] = []) => {
  const normalized = q.toLowerCase().trim()

  return points.filter((p) => {
    const matchesQuery = !normalized || p.name.toLowerCase().includes(normalized)
    // Empty categories → not in category search → stay visible when type filters are active.
    const matchesType =
      types.length === 0 ||
      p.categories.length === 0 ||
      p.categories.some((t) => types.includes(t))
    return matchesQuery && matchesType
  })
}

/** Known category ids only — unknown types are omitted from selectors. */
export const getPointTypes = (points: Point[]) => {
  const known = getCategoriesRegistry()
  return [...new Set(points.flatMap((p) => p.categories))]
    .filter((type) => type in known)
    .sort()
}
