import { useEffect, useRef, useState } from 'react'
import { applyPointEdits } from '@utils/normalizeMarker'
import type { Point } from '@type'

/** Debounced local draft for editing a Point, flushed on blur or timer. */
export function usePointDraft(
  point: Point | null,
  onChange: (point: Point) => void,
) {
  const [draft, setDraft] = useState<Point | null>(point)
  const draftRef = useRef<Point | null>(point)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setDraft(point)
    draftRef.current = point
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [point?.id])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const scheduleCommit = (partial: Partial<Point>) => {
    if (!draftRef.current) return
    const next = applyPointEdits(draftRef.current, partial)
    draftRef.current = next
    setDraft(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (draftRef.current) onChange(draftRef.current)
    }, 250)
  }

  const flushCommit = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (draftRef.current) onChange(draftRef.current)
  }

  return {
    draft,
    draftRef,
    scheduleCommit,
    flushCommit,
  }
}
