import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { loadCollapseDataset } from '@utils/datasets'
import type { CollapsePolygon, Point } from '@type'

export type CollapseSession = {
  parent: Point
  nested: Point[]
  polygon: CollapsePolygon | null
  previousPoints: Point[]
}

export type MapFocusRequest = {
  key: number
  points: { lat: number; lng: number }[]
}

type UseCollapseSessionArgs = {
  points: Point[]
  setPoints: Dispatch<SetStateAction<Point[]>>
}

export function useCollapseSession({ points, setPoints }: UseCollapseSessionArgs) {
  const [session, setSession] = useState<CollapseSession | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [mapFocus, setMapFocus] = useState<MapFocusRequest | null>(null)
  const mapFocusKey = useRef(0)
  const pointsRef = useRef(points)
  pointsRef.current = points

  const clearSession = () => {
    setSession(null)
    setExpanded(true)
  }

  const exit = () => {
    if (!session) return null
    const previous = session.previousPoints
    setPoints(previous)
    clearSession()
    return previous
  }

  const enter = async (point: Point, collapseFile: string) => {
    const { points: nested, polygon } = await loadCollapseDataset(collapseFile)
    const previousPoints = pointsRef.current
    setSession({ parent: point, nested, polygon, previousPoints })
    setExpanded(true)
    setPoints([...previousPoints.filter((p) => p.id !== point.id), ...nested])
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
    toggleExpanded: () => setExpanded((open) => !open),
  }
}
