import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import type { Point } from '@type'
import {
  CATEGORY_TYPE,
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_PICTURE,
  FALLBACK_POINT_CATEGORY,
  getCategoryImageUrl,
  getCategoryRenderType,
  getPinEmojiForCategory,
  POINT_CATEGORY_CONFIG,
  RECT_POINT_CATEGORY_IDS,
  resolvePointCategoryConfig,
  type ResolvedPointCategoryConfig,
} from '@type/categories'

export type { ResolvedPointCategoryConfig as PointIconConfig }

export const POINT_ICON_CONFIG = POINT_CATEGORY_CONFIG
export const CLUSTER_ICON_ID = 'cluster-button'

export function getPointCategoryId(point: Point): string {
  const categoryId = point.type[0]
  if (categoryId && categoryId in POINT_CATEGORY_CONFIG) return categoryId
  if (point.icon in POINT_CATEGORY_CONFIG) return point.icon
  return FALLBACK_POINT_CATEGORY.id
}

export function getPointIconKey(point: Point): string {
  return getPointCategoryId(point)
}

export function getPointIconConfig(point: Point): ResolvedPointCategoryConfig {
  return resolvePointCategoryConfig(getPointCategoryId(point))
}

/** Small rectangle for `icon` render type (clusters with pins). */
export const ICON_MARKER_WIDTH = 56
export const ICON_MARKER_HEIGHT = 40

/** Large rectangle for `picture` render type (never clustered). */
export const PICTURE_MARKER_WIDTH = 140
export const PICTURE_MARKER_HEIGHT = 100

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

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  if (/^https?:\/\//i.test(url)) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('fetch failed')
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      try {
        return await loadImageElement(objectUrl)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      // Fall through to direct image load.
    }
  }

  return loadImageElement(url)
}

function createRectPlaceholderImageData(
  width: number,
  height: number,
  borderColor: string,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  const radius = Math.max(4, Math.round(Math.min(width, height) * 0.12))
  const border = Math.max(2, Math.round(Math.min(width, height) * 0.04))

  roundRect(ctx, 0, 0, width, height, radius)
  ctx.fillStyle = '#f3f4f6'
  ctx.fill()

  roundRect(ctx, 0, 0, width, height, radius)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = border
  ctx.stroke()

  return ctx.getImageData(0, 0, width, height)
}

function createRectImageData(
  image: HTMLImageElement,
  width: number,
  height: number,
  borderColor: string,
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  const radius = Math.max(4, Math.round(Math.min(width, height) * 0.12))
  const border = Math.max(2, Math.round(Math.min(width, height) * 0.04))
  const innerX = border
  const innerY = border
  const innerW = width - border * 2
  const innerH = height - border * 2

  roundRect(ctx, 0, 0, width, height, radius)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  roundRect(ctx, 0, 0, width, height, radius)
  ctx.strokeStyle = borderColor
  ctx.lineWidth = border
  ctx.stroke()

  ctx.save()
  roundRect(ctx, innerX, innerY, innerW, innerH, Math.max(2, radius - 1))
  ctx.clip()

  const scale = Math.min(innerW / image.width, innerH / image.height)
  const drawW = image.width * scale
  const drawH = image.height * scale
  const drawX = innerX + (innerW - drawW) / 2
  const drawY = innerY + (innerH - drawH) / 2
  ctx.drawImage(image, drawX, drawY, drawW, drawH)
  ctx.restore()

  return ctx.getImageData(0, 0, width, height)
}

async function createRectMarkerImageData(
  pictureUrl: string,
  borderColor: string,
  width: number,
  height: number,
): Promise<ImageData> {
  const urls =
    pictureUrl === DEFAULT_CATEGORY_PICTURE
      ? [DEFAULT_CATEGORY_PICTURE]
      : [pictureUrl, DEFAULT_CATEGORY_PICTURE]

  for (const url of urls) {
    try {
      const img = await loadImage(url)
      return createRectImageData(img, width, height, borderColor)
    } catch {
      // Try next URL.
    }
  }

  return createRectPlaceholderImageData(width, height, borderColor)
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

export function buildIconAnchorExpression(): ExpressionSpecification {
  const pairs = RECT_POINT_CATEGORY_IDS.flatMap((key) => [key, 'center'])
  return ['match', ['get', 'iconKey'], ...pairs, 'bottom'] as unknown as ExpressionSpecification
}

export async function loadMapIcons(map: MapLibreMap): Promise<void> {
  for (const [categoryId, config] of Object.entries(POINT_CATEGORY_CONFIG)) {
    const typeConfig = CATEGORY_TYPE[config.type]
    const color = typeConfig?.color ?? DEFAULT_CATEGORY_COLOR
    const renderType = getCategoryRenderType(categoryId)
    let imageData: ImageData

    if (renderType === 'picture') {
      const pictureUrl = getCategoryImageUrl(categoryId)!
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        PICTURE_MARKER_WIDTH,
        PICTURE_MARKER_HEIGHT,
      )
    } else if (renderType === 'icon') {
      const pictureUrl = getCategoryImageUrl(categoryId)!
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        ICON_MARKER_WIDTH,
        ICON_MARKER_HEIGHT,
      )
    } else {
      imageData = createPinImageData(color, getPinEmojiForCategory(categoryId))
    }

    if (map.hasImage(categoryId)) {
      map.removeImage(categoryId)
    }
    map.addImage(categoryId, imageData, { pixelRatio: 2 })
  }

  const clusterImage = createClusterButtonImageData()
  if (map.hasImage(CLUSTER_ICON_ID)) {
    map.removeImage(CLUSTER_ICON_ID)
  }
  map.addImage(CLUSTER_ICON_ID, clusterImage, { pixelRatio: 2 })
}
