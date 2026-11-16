import { DEFAULT_CATEGORY_PICTURE } from '@type/categories'
import {
  createRootCategorizedPinImageData,
  createSubcategoryCategorizedPinImageData,
} from '@utils/categorizedPinIcon'
import { resolvePublicUrl } from '@utils/publicUrl'

export type RectMarkerStyle = 'framed' | 'image'

export function roundRect(
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

/** Legacy canvas pin (non-categorized fallbacks). */
export function createPinImageData(color: string, icon: string): ImageData {
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

export async function createCategorizedPinImageData(options: {
  pinColor: string
  emoji: string
  iconSvg?: string | null
  subcategoryId?: string | null
  subcategoryColor?: string
  subcategoryEmoji?: string
  subcategoryIconSvg?: string | null
}): Promise<ImageData> {
  const {
    pinColor,
    emoji,
    iconSvg,
    subcategoryId,
    subcategoryColor,
    subcategoryEmoji,
    subcategoryIconSvg,
  } = options
  if (subcategoryId && subcategoryColor) {
    return createSubcategoryCategorizedPinImageData({
      pinColor,
      emoji,
      iconSvg,
      badgeColor: subcategoryColor,
      badgeEmoji: subcategoryEmoji,
      badgeIconSvg: subcategoryIconSvg,
    })
  }
  return createRootCategorizedPinImageData({ pinColor, emoji, iconSvg })
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
    // Minimal pad — photo fills more of the marker for stronger map contrast.
    const pad = Math.max(2, Math.round(Math.min(width, height) * 0.02))
    const maxW = width - pad * 2
    const maxH = height - pad * 2
    const scale = Math.min(maxW / image.width, maxH / image.height)
    const drawW = image.width * scale
    const drawH = image.height * scale
    const drawX = (width - drawW) / 2
    const drawY = (height - drawH) / 2
    const radius = Math.max(4, Math.round(Math.min(drawW, drawH) * 0.06))

    // Picture / SVG only — no white frame. Light contrast for photos (skip for SVG).
    const isSvgSource =
      typeof image.src === 'string' &&
      (/\.svg(?:[?#]|$)/i.test(image.src) || image.src.startsWith('data:image/svg'))
    ctx.save()
    roundRect(ctx, drawX, drawY, drawW, drawH, radius)
    ctx.clip()
    if (!isSvgSource) {
      ctx.filter = 'contrast(1.2) saturate(1.08) brightness(1.02)'
    }
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, drawX, drawY, drawW, drawH)
    ctx.restore()

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

export async function createRectMarkerImageData(
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
export function createClusterButtonImageData(): ImageData {
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
