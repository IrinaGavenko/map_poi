import type { CategoriesDocument, Marker, Point } from '@type'
import {
  getCategoriesRegistry,
  type CategoryTypeConfig,
} from '@type/categories'
import { pointToMarker } from '@utils/normalizeMarker'

export function serializeMarkers(points: Point[]): Marker[] {
  return points.map((point) => pointToMarker(point))
}

/** Snapshot the in-memory registry as a categories document. */
export function serializeCategories(): CategoriesDocument {
  const registry = getCategoriesRegistry()
  const categoryTypes: Record<string, CategoryTypeConfig> = {}
  for (const [id, config] of Object.entries(registry)) {
    categoryTypes[id] = { ...config }
  }
  return {
    version: 1,
    categoryTypes,
  }
}

export function markersJsonString(points: Point[]): string {
  return `${JSON.stringify(serializeMarkers(points), null, 2)}\n`
}

export function categoriesJsonString(): string {
  return `${JSON.stringify(serializeCategories(), null, 2)}\n`
}
