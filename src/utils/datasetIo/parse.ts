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
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (typeof record.version !== 'number') return false
  return !!record.categoryTypes && typeof record.categoryTypes === 'object'
}

/** `points` must be a Marker array (not a bare markers document). */
export function parseMarkersJson(data: unknown): ParseMarkersResult {
  if (!Array.isArray(data)) {
    return {
      ok: false,
      error: 'points must be an array of markers.',
    }
  }

  const points: Point[] = []
  let skipped = 0
  for (const item of data) {
    const point = normalizeMarker(item)
    if (point) points.push(point)
    else skipped += 1
  }

  if (data.length > 0 && points.length === 0) {
    return { ok: false, error: 'No valid markers found in points array.' }
  }

  return { ok: true, points, skipped }
}

export function parseCategoriesJson(data: unknown): ParseCategoriesResult {
  if (!isCategoriesDocument(data)) {
    return {
      ok: false,
      error: 'categories must include a version number and categoryTypes object.',
    }
  }
  return { ok: true, document: data }
}

export function parseJsonText(
  text: string,
): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(text) as unknown }
  } catch {
    return { ok: false, error: 'File is not valid JSON.' }
  }
}
