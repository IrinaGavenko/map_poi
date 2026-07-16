import { useState, type Dispatch, type SetStateAction } from 'react'
import { createPoint } from '@utils/createPoint'
import type { Point } from '@type'

type UsePointSelectionArgs = {
  setPoints: Dispatch<SetStateAction<Point[]>>
  onCollapsibleSelect: (point: Point, collapseFile: string) => void
  onBeforeCollapse?: () => void
}

export function usePointSelection({
  setPoints,
  onCollapsibleSelect,
  onBeforeCollapse,
}: UsePointSelectionArgs) {
  const [selected, setSelected] = useState<Point | null>(null)

  const selectPoint = (point: Point) => {
    const collapseFile =
      typeof point.isCollapsible === 'string' ? point.isCollapsible.trim() : ''

    if (collapseFile) {
      onBeforeCollapse?.()
      setSelected(null)
      onCollapsibleSelect(point, collapseFile)
      return
    }

    setSelected(point)
  }

  const updateSelectedPoint = (point: Point) => {
    setSelected(point)
    setPoints((points) => points.map((p) => (p.id === point.id ? point : p)))
  }

  const deleteSelectedPoint = () => {
    if (!selected) return
    const id = selected.id
    setPoints((points) => points.filter((p) => p.id !== id))
    setSelected(null)
  }

  const addPoint = (coordinates: { lat: number; lng: number }) => {
    const point = createPoint(coordinates)
    setPoints((points) => [point, ...points])
    setSelected(point)
    return point
  }

  return {
    selected,
    setSelected,
    selectPoint,
    updateSelectedPoint,
    deleteSelectedPoint,
    addPoint,
  }
}
