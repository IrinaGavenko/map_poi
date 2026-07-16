import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { loadCollapsePoints } from '@utils/datasets'
import type { Point } from '@type'

export type CollapseSession = {
  parent: Point
  nested: Point[]
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
    const nested = await loadCollapsePoints(collapseFile)
    const previousPoints = pointsRef.current
    setSession({ parent: point, nested, previousPoints })
    setExpanded(true)
    setPoints([...previousPoints.filter((p) => p.id !== point.id), ...nested])
    mapFocusKey.current += 1
    setMapFocus({
      key: mapFocusKey.current,
      points: nested.map((p) => p.coordinates),
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
