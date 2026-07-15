import type { Point } from '@type'

export const filterPoints = (points: Point[], q: string, types: string[] = []) => {
  const normalized = q.toLowerCase().trim()

  return points.filter((p) => {
    const matchesQuery = !normalized || p.name.toLowerCase().includes(normalized)
    const matchesType = types.length === 0 || p.type.some((t) => types.includes(t))
    return matchesQuery && matchesType
  })
}

export const getPointTypes = (points: Point[]) =>
  [...new Set(points.flatMap((p) => p.type))].sort()
