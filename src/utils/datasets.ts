import type { Point } from '@type'

const modules = import.meta.glob('../data/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Point[]>

function datasetIdFromPath(path: string): string {
  const file = path.split('/').pop() ?? path
  return file.replace(/\.json$/i, '')
}

const byId = Object.fromEntries(
  Object.entries(modules).map(([path, data]) => [datasetIdFromPath(path), data]),
) as Record<string, Point[]>

export const DATASET_IDS = Object.keys(byId).sort()

export const DEFAULT_DATASET_ID = DATASET_IDS.includes('points')
  ? 'points'
  : (DATASET_IDS[0] ?? 'points')

const STORAGE_KEY = 'miami-map-dataset'

export function resolveDatasetId(id: string | null | undefined): string {
  if (id && DATASET_IDS.includes(id)) return id
  return DEFAULT_DATASET_ID
}

export function getStoredDatasetId(): string {
  try {
    return resolveDatasetId(localStorage.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_DATASET_ID
  }
}

export function setStoredDatasetId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, resolveDatasetId(id))
  } catch {
    // ignore quota / private mode errors
  }
}

export function loadDataset(id: string): Point[] {
  const data = byId[resolveDatasetId(id)]
  return data ? [...data] : []
}
