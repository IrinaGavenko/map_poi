import { useMemo, useState } from 'react'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import type { Point } from '@type'

export function usePointFilters(points: Point[]) {
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const filtered = useMemo(
    () => filterPoints(points, query, selectedTypes),
    [points, query, selectedTypes],
  )
  const availableTypes = useMemo(() => getPointTypes(points), [points])

  const resetFilters = () => {
    setQuery('')
    setSelectedTypes([])
  }

  return {
    query,
    setQuery,
    selectedTypes,
    setSelectedTypes,
    filtered,
    availableTypes,
    resetFilters,
  }
}
