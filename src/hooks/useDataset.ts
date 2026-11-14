import { useEffect, useState } from 'react'
import type {
  CategoriesDocument,
  CollapseDataset,
  MapDatasetMeta,
  Point,
} from '@type'
import { setCategoriesRegistry } from '@type/categories'
import {
  categoriesForWorkingDataset,
  emptyWorkingDataset,
  loadWorkingDataset,
  type WorkingMapDataset,
} from '@utils/datasetIo'
import {
  DEFAULT_PINNED_SIZE,
  setPinnedSize,
  type PinnedSize,
} from '@utils/pinnedSize'

function applyCategories(doc: CategoriesDocument) {
  setCategoriesRegistry(doc)
}

export function useDataset() {
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(1)
  const [meta, setMeta] = useState<MapDatasetMeta>({})
  const [pinnedSize, setPinnedSizeState] = useState<PinnedSize>(DEFAULT_PINNED_SIZE)
  const [points, setPoints] = useState<Point[]>([])
  const [collapses, setCollapses] = useState<Record<string, CollapseDataset>>({})
  const [categoriesRevision, setCategoriesRevision] = useState(0)
  const [mapRevision, setMapRevision] = useState(0)

  useEffect(() => {
    const saved = loadWorkingDataset()
    const next = saved ?? emptyWorkingDataset()
    applyCategories(next.categories)
    setPinnedSize(next.pinnedSize)
    setPinnedSizeState(next.pinnedSize)
    setVersion(next.version)
    setMeta(next.meta)
    setPoints(next.points)
    setCollapses(next.collapses)
    setCategoriesRevision((n) => n + 1)
    setMapRevision((n) => n + 1)
    setReady(true)
  }, [])

  const bumpCategoriesRevision = () => {
    setCategoriesRevision((n) => n + 1)
  }

  const replaceCategories = (doc: CategoriesDocument) => {
    applyCategories(doc)
    bumpCategoriesRevision()
  }

  const replacePoints = (next: Point[]) => {
    setPoints(next)
  }

  const applyWorkingDataset = (next: WorkingMapDataset) => {
    applyCategories(next.categories)
    setPinnedSize(next.pinnedSize)
    setPinnedSizeState(next.pinnedSize)
    setVersion(next.version)
    setMeta(next.meta)
    setPoints(next.points)
    setCollapses(next.collapses)
    setCategoriesRevision((n) => n + 1)
    setMapRevision((n) => n + 1)
  }

  const getWorkingSnapshot = (rootPoints: Point[]): WorkingMapDataset => ({
    version,
    meta,
    pinnedSize,
    categories: categoriesForWorkingDataset(),
    points: rootPoints,
    collapses,
  })

  return {
    ready,
    version,
    meta,
    pinnedSize,
    points,
    setPoints,
    collapses,
    categoriesRevision,
    mapRevision,
    bumpCategoriesRevision,
    replacePoints,
    replaceCategories,
    applyWorkingDataset,
    getWorkingSnapshot,
  }
}
