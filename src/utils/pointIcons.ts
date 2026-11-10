import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Point } from '@type'
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_PICTURE,
  FALLBACK_CATEGORY,
  getCategoriesRegistry,
  getCategoryColor,
  getCategoryConfig,
  getCategoryImageUrl,
  getCategoryListIcon,
  getCategoryVisualMode,
  getRootCategoryId,
  isRootCategory,
  type MarkerVisualMode,
} from '@type/categories'
import { resolvePublicUrl } from '@utils/publicUrl'

export type PointIconConfig = {
  id: string
  color: string
  visualMode: MarkerVisualMode
  imageUrl?: string
  emoji: string
  /** Present when a categorized marker uses a subcategory badge. */
  subcategoryId?: string | null
  subcategoryColor?: string
  subcategoryEmoji?: string
}

export const CLUSTER_ICON_ID = 'cluster-button'

export function getPointCategoryId(point: Point): string {
  if (point.primaryCategoryId && point.primaryCategoryId in getCategoriesRegistry()) {
    return point.primaryCategoryId
  }
  const fromList = point.categories.find((id) => id in getCategoriesRegistry())
  return fromList ?? FALLBACK_CATEGORY.id
}

/**
 * Leaf category for categorized markers (may be a subcategory).
 * Pinned/custom ignore subcategory hierarchy for styling.
 */
export function getPointLeafCategoryId(point: Point): string {
  return getPointCategoryId(point)
}

/** Root category used for the main categorized marker look. */
export function getPointRootCategoryId(point: Point): string {
  return getRootCategoryId(getPointLeafCategoryId(point))
}

/** Subcategory id when categorized leaf ≠ root; otherwise null. */
export function getPointSubcategoryId(point: Point): string | null {
  if (point.markerType !== 'categorized') return null
  const leaf = getPointLeafCategoryId(point)
  if (isRootCategory(leaf)) return null
  return leaf
}

/** MapLibre image id for this point (category id, or unique point art). */
export function getPointIconKey(point: Point): string {
  if (point.markerType === 'pinned') {
    return point.displayPicture ? `point:${point.id}` : getPointCategoryId(point)
  }
  if (point.markerType === 'custom') {
    if (point.displayPicture && !point.primaryCategoryId) return `point:${point.id}`
    if (point.displayPicture) {
      const categoryImage = getCategoryImageUrl(point.primaryCategoryId)
      const resolvedDisplay = resolvePublicUrl(point.displayPicture)
      const resolvedCategory = categoryImage ? resolvePublicUrl(categoryImage) : ''
      if (resolvedDisplay && resolvedDisplay !== resolvedCategory) return `point:${point.id}`
    }
    return getPointCategoryId(point)
  }

  // Categorized: composite root+sub badge needs its own image key.
  const leaf = getPointLeafCategoryId(point)
  const root = getRootCategoryId(leaf)
  if (leaf !== root) return `${root}__${leaf}`
  return root
}

export function getPointVisualMode(point: Point): MarkerVisualMode {
  if (point.markerType === 'pinned') return 'picture'
  if (point.markerType === 'custom') return 'icon'
  // Main marker look comes from the root category.
  return getCategoryVisualMode(getPointRootCategoryId(point))
}

export function getPointIconConfig(point: Point): PointIconConfig {
  const leafId = getPointLeafCategoryId(point)
  const rootId =
    point.markerType === 'categorized' ? getRootCategoryId(leafId) : leafId
  const subcategoryId = getPointSubcategoryId(point)
  const visualMode = getPointVisualMode(point)
  const imageUrl =
    point.displayPicture ||
    getCategoryImageUrl(rootId) ||
    undefined
  return {
    id: rootId,
    color: getCategoryColor(rootId),
    visualMode,
    imageUrl: imageUrl ? resolvePublicUrl(imageUrl) : undefined,
    emoji: getCategoryListIcon(rootId),
    subcategoryId,
    subcategoryColor: subcategoryId ? getCategoryColor(subcategoryId) : undefined,
    subcategoryEmoji: subcategoryId ? getCategoryListIcon(subcategoryId) : undefined,
  }
}

/** Whether this point should stay outside the MapLibre cluster source. */
export function isUnclusteredPoint(point: Point): boolean {
  return getPointVisualMode(point) === 'picture' || point.markerType === 'pinned'
}

/** Small rectangle for `icon` / custom markers. */
export const ICON_MARKER_WIDTH = 56
export const ICON_MARKER_HEIGHT = 40

/** Large rectangle for `picture` / pinned markers. */
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

type SubcategoryBadge = {
  color: string
  emoji: string
}

function createPinImageData(
  color: string,
  icon: string,
  subcategory?: SubcategoryBadge | null,
): ImageData {
  // Extra right/top room when a subcategory badge is drawn.
  const padRight = subcategory ? 14 : 0
  const padTop = subcategory ? 6 : 0
  const width = 48 + padRight
  const height = 64 + padTop
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  const pinW = 48
  const pinH = 64
  const path = new Path2D(
    'M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z',
  )
  ctx.save()
  ctx.translate(0, padTop)
  ctx.scale(pinW / 24, pinH / 32)
  ctx.fillStyle = color
  ctx.fill(path)
  ctx.restore()

  ctx.font = '18px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, pinW / 2, padTop + (12 / 32) * pinH)

  if (subcategory) {
    const badgeR = 11
    const badgeX = width - badgeR - 1
    const badgeY = badgeR + 1
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(badgeX, badgeY, badgeR - 1.5, 0, Math.PI * 2)
    ctx.fillStyle = subcategory.color
    ctx.fill()
    ctx.font = '11px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(subcategory.emoji, badgeX, badgeY + 0.5)
  }

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

type RectMarkerStyle = 'framed' | 'image'

function createRectPlaceholderImageData(
  width: number,
  height: number,
  borderColor: string,
  style: RectMarkerStyle = 'framed',
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  if (style === 'image') {
    return ctx.getImageData(0, 0, width, height)
  }

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
  style: RectMarkerStyle = 'framed',
): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  if (style === 'image') {
    // Leave room so soft shadow / oval aren't clipped at the canvas edge.
    const pad = Math.max(8, Math.round(Math.min(width, height) * 0.1))
    const maxW = width - pad * 2
    const maxH = height - pad * 2
    const scale = Math.min(maxW / image.width, maxH / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const drawX = (width - drawW) / 2
    const drawY = (height - drawH) / 2 - Math.round(pad * 0.15)
    const cx = drawX + drawW / 2
    const cy = drawY + drawH / 2

    // Soft dark oval behind the image for contrast on light map tiles.
    const ovalRx = drawW * 0.58
    const ovalRy = drawH * 0.52
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(ovalRx, ovalRy)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.55)')
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.28)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = Math.max(10, Math.round(Math.min(width, height) * 0.14))
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = Math.max(4, Math.round(Math.min(width, height) * 0.05))
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
    ctx.restore()

    // Crisp image on top; shadow stays underneath.
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
    return ctx.getImageData(0, 0, width, height)
  }

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
  style: RectMarkerStyle = 'framed',
): Promise<ImageData> {
  const resolved = resolvePublicUrl(pictureUrl)
  const urls =
    resolved === DEFAULT_CATEGORY_PICTURE
      ? [DEFAULT_CATEGORY_PICTURE]
      : [resolved, DEFAULT_CATEGORY_PICTURE]

  for (const url of urls) {
    try {
      const img = await loadImage(url)
      return createRectImageData(img, width, height, borderColor, style)
    } catch {
      // Try next URL.
    }
  }

  return createRectPlaceholderImageData(width, height, borderColor, style)
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

async function addOrReplaceImage(map: MapLibreMap, id: string, imageData: ImageData) {
  if (map.hasImage(id)) {
    map.removeImage(id)
  }
  map.addImage(id, imageData, { pixelRatio: 2 })
}

export async function loadMapIcons(map: MapLibreMap, points: Point[] = []): Promise<void> {
  const iconKeys = new Set<string>()

  for (const categoryId of Object.keys(getCategoriesRegistry())) {
    const visualMode = getCategoryVisualMode(categoryId)
    const color = getCategoryColor(categoryId)
    let imageData: ImageData

    if (visualMode === 'picture') {
      const pictureUrl = getCategoryImageUrl(categoryId) ?? DEFAULT_CATEGORY_PICTURE
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        PICTURE_MARKER_WIDTH,
        PICTURE_MARKER_HEIGHT,
      )
    } else if (visualMode === 'icon') {
      const pictureUrl = getCategoryImageUrl(categoryId) ?? DEFAULT_CATEGORY_PICTURE
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        ICON_MARKER_WIDTH,
        ICON_MARKER_HEIGHT,
      )
    } else {
      imageData = createPinImageData(color, getCategoryListIcon(categoryId))
    }

    await addOrReplaceImage(map, categoryId, imageData)
    iconKeys.add(categoryId)
  }

  for (const point of points) {
    const key = getPointIconKey(point)
    if (iconKeys.has(key)) continue
    const config = getPointIconConfig(point)
    const visualMode = getPointVisualMode(point)
    const color = config.color || DEFAULT_CATEGORY_COLOR
    const pictureUrl = config.imageUrl || DEFAULT_CATEGORY_PICTURE
    const subcategoryBadge =
      config.subcategoryId && config.subcategoryColor && config.subcategoryEmoji
        ? { color: config.subcategoryColor, emoji: config.subcategoryEmoji }
        : null

    const markerStyle: RectMarkerStyle =
      point.markerType === 'pinned' ? 'image' : 'framed'

    let imageData: ImageData
    if (visualMode === 'picture') {
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        PICTURE_MARKER_WIDTH,
        PICTURE_MARKER_HEIGHT,
        markerStyle,
      )
    } else if (visualMode === 'icon') {
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        ICON_MARKER_WIDTH,
        ICON_MARKER_HEIGHT,
        markerStyle,
      )
    } else {
      imageData = createPinImageData(color, config.emoji, subcategoryBadge)
    }

    await addOrReplaceImage(map, key, imageData)
    iconKeys.add(key)
  }

  const clusterImage = createClusterButtonImageData()
  await addOrReplaceImage(map, CLUSTER_ICON_ID, clusterImage)
}

export function resolvePointCategoryConfig(categoryId: string) {
  const config = getCategoryConfig(categoryId)
  return {
    ...config,
    color: getCategoryColor(categoryId),
  }
}
