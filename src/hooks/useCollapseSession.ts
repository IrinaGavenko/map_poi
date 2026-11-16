import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { CollapseDataset, CollapsePolygon, Point } from '@type'
import { resolveCollapse } from '@utils/datasetIo'

export type CollapseSession = {
  parent: Point
  nested: Point[]
  polygon: CollapsePolygon | null
  previousPoints: Point[]
}

export type MapFocusRequest = {
  key: number
  points: { lat: number; lng: number }[]
  /** Dataset open/switch uses jump; nested zone keep fly. Default fly. */
  animate?: boolean
}

type UseCollapseSessionArgs = {
  points: Point[]
  setPoints: Dispatch<SetStateAction<Point[]>>
  getCollapses: () => Record<string, CollapseDataset>
}

export function useCollapseSession({
  points,
  setPoints,
  getCollapses,
}: UseCollapseSessionArgs) {
  const [session, setSession] = useState<CollapseSession | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [mapFocus, setMapFocus] = useState<MapFocusRequest | null>(null)
  const mapFocusKey = useRef(0)
  const pointsRef = useRef(points)
  pointsRef.current = points

  const clearSession = () => {
    setSession(null)
    setExpanded(true)
    setMapFocus(null)
  }

  const exit = () => {
    if (!session) return null
    const previous = session.previousPoints
    setPoints(previous)
    clearSession()
    return previous
  }

  const enter = (point: Point, collapseFile: string) => {
    const previousPoints = pointsRef.current
    const nestedDataset = resolveCollapse(getCollapses(), collapseFile)
    const nested = nestedDataset.points
    const polygon = nestedDataset.polygon

    setSession({ parent: point, nested, polygon, previousPoints })
    setExpanded(true)
    setPoints(nested)

    mapFocusKey.current += 1
    const focusPoints =
      polygon && polygon.coordinates.length > 0
        ? polygon.coordinates
        : nested.map((p) => p.coordinates)
    setMapFocus({
      key: mapFocusKey.current,
      points: focusPoints,
    })
  }

  return {
    session,
    expanded,
    mapFocus,
    isActive: session !== null,
    isDrawerExpanded: session !== null && expanded,
    enter,
    exit,
    clearSession,
    minimize: () => setExpanded(false),
    expand: () => setExpanded(true),
    toggleExpanded: () => setExpanded((open) => (open ? false : true)),
  }
}
