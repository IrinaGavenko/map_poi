import { useEffect } from 'react'
import {
  categoriesForWorkingDataset,
  saveWorkingDataset,
  type WorkingMapDataset,
} from '@utils/datasetIo'
import { PERSIST_DEBOUNCE_MS } from './constants'

type PersistSlice = Pick<
  WorkingMapDataset,
  'version' | 'meta' | 'pinnedSize' | 'points' | 'collapses'
> & {
  ready: boolean
  categoriesRevision: number
}

/** Auto-save full working map (skipped while a nested zone is open). */
export function useWorkingDatasetPersist(
  dataset: PersistSlice,
  collapseActive: boolean,
) {
  useEffect(() => {
    if (!dataset.ready) return
    if (collapseActive) return

    const timer = window.setTimeout(() => {
      saveWorkingDataset({
        version: dataset.version,
        meta: dataset.meta,
        pinnedSize: dataset.pinnedSize,
        categories: categoriesForWorkingDataset(),
        points: dataset.points,
        collapses: dataset.collapses,
      })
    }, PERSIST_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [
    dataset.ready,
    dataset.points,
    dataset.categoriesRevision,
    dataset.meta,
    dataset.pinnedSize,
    dataset.collapses,
    dataset.version,
    collapseActive,
  ])
}
