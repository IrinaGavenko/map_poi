import type { ExpressionSpecification, Map } from 'maplibre-gl'
import type { Point } from '@type'
import {
  FALLBACK_POINT_CATEGORY,
  POINT_CATEGORY_CONFIG,
  type PointCategoryConfig,
} from '@type/categories'

export type { PointCategoryConfig as PointIconConfig }

export const POINT_ICON_CONFIG = POINT_CATEGORY_CONFIG
export const CLUSTER_ICON_ID = 'cluster-button'

export function getPointIconKey(point: Point): string {
  const type = point.type[0]
  if (type && type in POINT_CATEGORY_CONFIG) return type
  if (point.icon in POINT_CATEGORY_CONFIG) return point.icon
  return FALLBACK_POINT_CATEGORY.id
}

export function getPointIconConfig(point: Point): PointCategoryConfig {
  return POINT_CATEGORY_CONFIG[getPointIconKey(point)]
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + width, y, x + width, y + height, radius)
  ctx.arcTo(x + width, y + height, x, y + height, radius)
  ctx.arcTo(x, y + height, x, y, radius)
  ctx.arcTo(x, y, x + width, y, radius)
  ctx.closePath()
}

function createPinImageData(color: string, icon: string): ImageData {
  const width = 48
  const height = 64
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  const path = new Path2D(
    'M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z',
  )
  ctx.save()
  ctx.scale(width / 24, height / 32)
  ctx.fillStyle = color
  ctx.fill(path)
  ctx.restore()

  ctx.font = '18px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, width / 2, (12 / 32) * height)

  return ctx.getImageData(0, 0, width, height)
}

/** Matches `.drawer-control-button` look: 40×40, white, border, shadow, radius 8. */
function createClusterButtonImageData(): ImageData {
  const size = 88
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(size, size)

  const pad = 8
  const button = size - pad * 2
  const radius = 16

  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 2
  roundRect(ctx, pad, pad, button, button, radius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetY = 0
  roundRect(ctx, pad, pad, button, button, radius)
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 2
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}

export function buildIconImageExpression(): ExpressionSpecification {
  const pairs = Object.keys(POINT_CATEGORY_CONFIG).flatMap((key) => [key, key])
  return ['match', ['get', 'iconKey'], ...pairs, FALLBACK_POINT_CATEGORY.id] as unknown as ExpressionSpecification
}

export function loadMapIcons(map: Map): Promise<void> {
  for (const [key, { color, icon }] of Object.entries(POINT_CATEGORY_CONFIG)) {
    const imageData = createPinImageData(color, icon)
    if (map.hasImage(key)) {
      map.removeImage(key)
    }
    map.addImage(key, imageData, { pixelRatio: 2 })
  }

  const clusterImage = createClusterButtonImageData()
  if (map.hasImage(CLUSTER_ICON_ID)) {
    map.removeImage(CLUSTER_ICON_ID)
  }
  map.addImage(CLUSTER_ICON_ID, clusterImage, { pixelRatio: 2 })

  return Promise.resolve()
}
