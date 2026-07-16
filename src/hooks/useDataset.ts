import { useEffect, useState } from 'react'
import { getStoredDatasetId, loadDataset, setStoredDatasetId } from '@utils/datasets'
import type { Point } from '@type'

export function useDataset() {
  const [datasetId, setDatasetId] = useState(getStoredDatasetId)
  const [points, setPoints] = useState<Point[]>([])

  useEffect(() => {
    let cancelled = false

    void loadDataset(datasetId).then((next) => {
      if (!cancelled) setPoints(next)
    })

    return () => {
      cancelled = true
    }
  }, [datasetId])

  const changeDataset = (nextId: string) => {
    setDatasetId(nextId)
    setStoredDatasetId(nextId)
  }

  return {
    datasetId,
    points,
    setPoints,
    changeDataset,
  }
}
