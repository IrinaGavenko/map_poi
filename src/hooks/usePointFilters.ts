import { useState } from 'react'
import { filterPoints, getPointTypes } from '@utils/filterPoints'
import type { Point } from '@type'

export function usePointFilters(points: Point[]) {
  const [query, setQuery] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])

  const filtered = filterPoints(points, query, selectedTypes)
  const availableTypes = getPointTypes(points)

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
