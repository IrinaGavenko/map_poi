import type { MapFocusRequest } from '../../hooks/useCollapseSession'
import type { CollapsePolygon, Point } from '@type'

export type { MapFocusRequest }

export type MapViewProps = {
  points: Point[]
  selected: Point | null
  setSelected: (point: Point) => void
  clearSelected: () => void
  addingPoint?: boolean
  onAddPoint?: (coordinates: { lat: number; lng: number }) => void
  focusRequest?: MapFocusRequest | null
  collapsePolygon?: CollapsePolygon | null
}
