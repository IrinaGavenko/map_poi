import { POINT_CATEGORIES } from '@type/categories'
import type { Point } from '@type'

export const filterPoints = (points: Point[], q: string, types: string[] = []) => {
  const normalized = q.toLowerCase().trim()

  return points.filter((p) => {
    const matchesQuery = !normalized || p.name.toLowerCase().includes(normalized)
    const matchesType = types.length === 0 || p.type.some((t) => types.includes(t))
    return matchesQuery && matchesType
  })
}

/** Known category ids only — unknown types (fallback pin) are omitted from selectors. */
export const getPointTypes = (points: Point[]) =>
  [...new Set(points.flatMap((p) => p.type))]
    .filter((type) => type in POINT_CATEGORIES)
    .sort()
