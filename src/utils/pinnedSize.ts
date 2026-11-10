/** Dataset-level scale for all pinned markers. `5` is largest. */
export type PinnedSize = 1 | 2 | 3 | 4 | 5

export const DEFAULT_PINNED_SIZE: PinnedSize = 3

/** MapLibre `icon-size` multipliers for pinned markers. */
const PINNED_ICON_SCALES: Record<PinnedSize, number> = {
  1: 0.55,
  2: 0.7,
  3: 0.9,
  4: 1.15,
  5: 3,
}

let currentPinnedSize: PinnedSize = DEFAULT_PINNED_SIZE

export function setPinnedSize(size: PinnedSize): void {
  currentPinnedSize = size
}

export function getPinnedSize(): PinnedSize {
  return currentPinnedSize
}

export function clampPinnedSize(value: unknown): PinnedSize {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PINNED_SIZE
  }
  const rounded = Math.round(value)
  if (rounded <= 1) return 1
  if (rounded >= 5) return 5
  return rounded as PinnedSize
}

export function pinnedSizeToIconScale(size: PinnedSize = getPinnedSize()): number {
  return PINNED_ICON_SCALES[size]
}

const baseIconSize = ['coalesce', ['get', 'iconSize'], 1]

/**
 * MapLibre expression: base `iconSize` × zoom factor.
 * `zoom` must be the input of a top-level interpolate/step (MapLibre rule).
 */
export const PINNED_ICON_SIZE_BY_ZOOM: unknown[] = [
  'interpolate',
  ['exponential', 1.6],
  ['zoom'],
  11,
  ['*', baseIconSize, 1.05],
  13,
  ['*', baseIconSize, 1.5],
  15,
  ['*', baseIconSize, 2.7],
  17,
  ['*', baseIconSize, 4.8],
  19,
  ['*', baseIconSize, 6.75],
]
