import type { CategoriesDocument, Point } from '@type'
import { normalizeMarker } from '@utils/normalizeMarker'

export type ParseMarkersSuccess = {
  ok: true
  points: Point[]
  skipped: number
}

export type ParseMarkersFailure = {
  ok: false
  error: string
}

export type ParseMarkersResult = ParseMarkersSuccess | ParseMarkersFailure

export type ParseCategoriesSuccess = {
  ok: true
  document: CategoriesDocument
}

export type ParseCategoriesFailure = {
  ok: false
  error: string
}

export type ParseCategoriesResult = ParseCategoriesSuccess | ParseCategoriesFailure

export function isCategoriesDocument(value: unknown): value is CategoriesDocument {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.version !== 'number') return false
  const hasCategories = !!record.categories && typeof record.categories === 'object'
  const hasCategoryTypes =
    !!record.categoryTypes && typeof record.categoryTypes === 'object'
  return hasCategories || hasCategoryTypes
}

function looksLikeMarkersDocument(value: unknown): boolean {
  if (Array.isArray(value)) return true
  if (!value || typeof value !== 'object') return false
  return Array.isArray((value as Record<string, unknown>).points)
}

export function detectJsonKind(
  value: unknown,
): 'markers' | 'categories' | 'unknown' {
  if (isCategoriesDocument(value) && !looksLikeMarkersDocument(value)) {
    return 'categories'
  }
  if (looksLikeMarkersDocument(value)) return 'markers'
  if (isCategoriesDocument(value)) return 'categories'
  return 'unknown'
}

export function parseMarkersJson(data: unknown): ParseMarkersResult {
  let rawList: unknown[]

  if (Array.isArray(data)) {
    rawList = data
  } else if (data && typeof data === 'object') {
    const points = (data as Record<string, unknown>).points
    if (!Array.isArray(points)) {
      return {
        ok: false,
        error: 'Markers file must be an array or an object with a points array.',
      }
    }
    rawList = points
  } else {
    return {
      ok: false,
      error: 'Markers file must be an array or an object with a points array.',
    }
  }

  const points: Point[] = []
  let skipped = 0
  for (const item of rawList) {
    const point = normalizeMarker(item)
    if (point) points.push(point)
    else skipped += 1
  }

  if (rawList.length > 0 && points.length === 0) {
    return { ok: false, error: 'No valid markers found in file.' }
  }

  return { ok: true, points, skipped }
}

export function parseCategoriesJson(data: unknown): ParseCategoriesResult {
  if (!isCategoriesDocument(data)) {
    return {
      ok: false,
      error:
        'Categories file must include a version number and categoryTypes (or categories).',
    }
  }
  return { ok: true, document: data }
}

export function parseJsonText(text: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }
}
