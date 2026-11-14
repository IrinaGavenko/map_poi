import {
  parseMapDatasetJson,
  serializeWorkingDataset,
  type WorkingMapDataset,
} from './mapDataset'

export const WORKING_DATASET_STORAGE_KEY = 'miami-map-working-dataset'

export type PersistResult = { ok: true } | { ok: false; error: string }

export function loadWorkingDataset(): WorkingMapDataset | null {
  try {
    const raw = localStorage.getItem(WORKING_DATASET_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const result = parseMapDatasetJson(parsed)
    if (result.ok === false) return null
    return result.dataset
  } catch {
    return null
  }
}

export function saveWorkingDataset(working: WorkingMapDataset): PersistResult {
  try {
    const payload = JSON.stringify(serializeWorkingDataset(working))
    localStorage.setItem(WORKING_DATASET_STORAGE_KEY, payload)
    return { ok: true }
  } catch {
    return {
      ok: false,
      error: 'Could not save the map in this browser (storage full or blocked).',
    }
  }
}
