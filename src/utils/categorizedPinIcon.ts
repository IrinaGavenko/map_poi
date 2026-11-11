/**
 * Rasterize categorized map pins from `src/components/Icons` SVGs.
 * - Root: `01-pin.svg`
 * - With subcategory: `04-pin-with-category.svg` layout (pin + badge)
 */

import pinSvg from '@components/Icons/01-pin.svg?raw'
import coffeeBadgeSvg from '@components/Icons/02-coffee.svg?raw'
import restaurantBadgeSvg from '@components/Icons/03-restaurant.svg?raw'
import pinWithCategorySvg from '@components/Icons/04-pin-with-category.svg?raw'

/** Known subcategory → dedicated badge SVG. */
const BADGE_SVG_BY_ID: Record<string, string> = {
  coffee: coffeeBadgeSvg,
  restaurants: restaurantBadgeSvg,
  restaurant: restaurantBadgeSvg,
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)))
}

function parseHexColor(color: string): { r: number; g: number; b: number } | null {
  const raw = color.trim()
  const short = /^#([0-9a-fA-F]{3})$/.exec(raw)
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16))
    return { r, g, b }
  }
  const full = /^#([0-9a-fA-F]{6})$/.exec(raw)
  if (full) {
    return {
      r: parseInt(full[1].slice(0, 2), 16),
      g: parseInt(full[1].slice(2, 4), 16),
      b: parseInt(full[1].slice(4, 6), 16),
    }
  }
  return null
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`
}

function mix(color: string, toward: number, amount: number): string {
  const rgb = parseHexColor(color)
  if (!rgb) return color
  return toHex({
    r: rgb.r + (toward - rgb.r) * amount,
    g: rgb.g + (toward - rgb.g) * amount,
    b: rgb.b + (toward - rgb.b) * amount,
  })
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/** Recolor the blue pin gradient stops. */
function tintPinGradient(svg: string, pinColor: string): string {
  const light = mix(pinColor, 255, 0.35)
  const dark = mix(pinColor, 0, 0.25)
  const id = uniqueId('pinGrad')
  return svg
    .replaceAll('id="pinBlue"', `id="${id}"`)
    .replaceAll('url(#pinBlue)', `url(#${id})`)
    .replaceAll('stop-color="#1685FF"', `stop-color="${light}"`)
    .replaceAll('stop-color="#0646C8"', `stop-color="${dark}"`)
}

/** Recolor the orange category badge gradient on pin-with-category. */
function tintBadgeGradient(svg: string, badgeColor: string): string {
  const light = mix(badgeColor, 255, 0.25)
  const dark = mix(badgeColor, 0, 0.15)
  const id = uniqueId('badgeGrad')
  return svg
    .replaceAll('id="coffeeOrange"', `id="${id}"`)
    .replaceAll('url(#coffeeOrange)', `url(#${id})`)
    .replaceAll('stop-color="#FF8A00"', `stop-color="${light}"`)
    .replaceAll('stop-color="#E94A00"', `stop-color="${dark}"`)
}

function tintBadgeAsset(svg: string, badgeColor: string): string {
  const light = mix(badgeColor, 255, 0.2)
  const dark = mix(badgeColor, 0, 0.2)
  let next = svg
  // Coffee brown gradient
  const coffeeId = uniqueId('coffeeGrad')
  next = next
    .replaceAll('id="coffeeBrown"', `id="${coffeeId}"`)
    .replaceAll('url(#coffeeBrown)', `url(#${coffeeId})`)
    .replaceAll('stop-color="#9A4B20"', `stop-color="${light}"`)
    .replaceAll('stop-color="#55270F"', `stop-color="${dark}"`)
  // Restaurant orange gradient
  const restId = uniqueId('restGrad')
  next = next
    .replaceAll('id="restaurantOrange"', `id="${restId}"`)
    .replaceAll('url(#restaurantOrange)', `url(#${restId})`)
    .replaceAll('stop-color="#FF9A00"', `stop-color="${light}"`)
    .replaceAll('stop-color="#F04A00"', `stop-color="${dark}"`)
  return next
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

async function svgStringToImage(svg: string): Promise<HTMLImageElement> {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    return await loadImageElement(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function drawEmoji(
  ctx: CanvasRenderingContext2D,
  emoji: string,
  x: number,
  y: number,
  fontPx: number,
) {
  ctx.font = `${fontPx}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, x, y)
}

/** Map display scale vs native SVG artboard (keeps pins closer to legacy size). */
const PIN_DISPLAY_SCALE = 0.5

/** Root categorized pin from `01-pin.svg` (tip at bottom center). */
export async function createRootCategorizedPinImageData(
  pinColor: string,
  emoji: string,
): Promise<ImageData> {
  const width = Math.round(128 * PIN_DISPLAY_SCALE)
  const height = Math.round(144 * PIN_DISPLAY_SCALE)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(width, height)

  const tinted = tintPinGradient(pinSvg, pinColor)
  const img = await svgStringToImage(tinted)
  ctx.drawImage(img, 0, 0, width, height)
  // White circle in pin.svg is roughly centered in the head.
  drawEmoji(
    ctx,
    emoji,
    64 * PIN_DISPLAY_SCALE,
    61 * PIN_DISPLAY_SCALE,
    Math.round(36 * PIN_DISPLAY_SCALE),
  )

  return ctx.getImageData(0, 0, width, height)
}

/**
 * Subcategory pin from `04-pin-with-category.svg` layout.
 * Tip stays at geographic anchor; badge uses category SVG when available.
 */
export async function createSubcategoryCategorizedPinImageData(options: {
  pinColor: string
  badgeColor: string
  badgeEmoji: string
  subcategoryId: string
}): Promise<ImageData> {
  const { pinColor, badgeColor, badgeEmoji, subcategoryId } = options
  const s = PIN_DISPLAY_SCALE

  // Layout from 04-pin-with-category.svg (tip at 64,145 in 160×160).
  // Larger subcategory badge; pad canvas so tip stays bottom-center for MapLibre.
  const tipX = 64 * s
  const tipY = 145 * s
  const badgeCxLocal = 124 * s
  const badgeCyLocal = 118 * s
  const badgeSize = 90 * s
  const badgeR = badgeSize / 2
  const contentRight = Math.max(160 * s, badgeCxLocal + badgeR + 2 * s)
  const contentLeft = Math.min(0, badgeCxLocal - badgeR)
  const outW = Math.round(2 * Math.max(tipX - contentLeft, contentRight - tipX))
  const outH = Math.round(Math.max(tipY, badgeCyLocal + badgeR + 2 * s))
  const padLeft = outW / 2 - tipX

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return new ImageData(outW, outH)

  const badgeCx = padLeft + badgeCxLocal
  const badgeCy = badgeCyLocal

  const badgeAsset = BADGE_SVG_BY_ID[subcategoryId]
  if (badgeAsset) {
    // Draw pin body only (01-pin), then dedicated badge asset.
    const pinTinted = tintPinGradient(pinSvg, pinColor)
    const pinImg = await svgStringToImage(pinTinted)
    // 01-pin is 128×144; place so tip (~y 139 of 144) aligns near tipY.
    const pinDrawW = 128 * s
    const pinDrawH = 144 * s
    const pinX = padLeft + tipX - pinDrawW / 2
    const pinY = tipY - (139 / 144) * pinDrawH
    ctx.drawImage(pinImg, pinX, pinY, pinDrawW, pinDrawH)

    const badgeTinted = tintBadgeAsset(badgeAsset, badgeColor)
    const badgeImg = await svgStringToImage(badgeTinted)
    ctx.drawImage(
      badgeImg,
      badgeCx - badgeR,
      badgeCy - badgeR,
      badgeSize,
      badgeSize,
    )
  } else {
    // Full pin-with-category template, recolored; emoji on badge if no asset.
    let svg = tintPinGradient(pinWithCategorySvg, pinColor)
    svg = tintBadgeGradient(svg, badgeColor)
    const img = await svgStringToImage(svg)
    ctx.drawImage(img, padLeft, tipY - 145 * s, 160 * s, 160 * s)
    // Cover baked-in coffee art with a larger solid badge + emoji.
    ctx.beginPath()
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(badgeCx, badgeCy, badgeR - 3 * s, 0, Math.PI * 2)
    ctx.fillStyle = badgeColor
    ctx.fill()
    drawEmoji(ctx, badgeEmoji, badgeCx, badgeCy, Math.round(30 * s))
  }

  return ctx.getImageData(0, 0, outW, outH)
}

/** Public URL helpers for list UI (`PointIcon`). */
export const CATEGORIZED_PIN_SVG_URL = new URL(
  '../components/Icons/01-pin.svg',
  import.meta.url,
).href

export const CATEGORIZED_PIN_WITH_CATEGORY_SVG_URL = new URL(
  '../components/Icons/04-pin-with-category.svg',
  import.meta.url,
).href

export function getCategoryBadgeSvgUrl(subcategoryId: string | null | undefined): string | null {
  if (!subcategoryId) return null
  if (subcategoryId === 'coffee') {
    return new URL('../components/Icons/02-coffee.svg', import.meta.url).href
  }
  if (subcategoryId === 'restaurants' || subcategoryId === 'restaurant') {
    return new URL('../components/Icons/03-restaurant.svg', import.meta.url).href
  }
  return null
}
