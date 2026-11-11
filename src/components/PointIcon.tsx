import { getPointIconConfig, getPointVisualMode } from '@utils/pointIcons'
import {
  CATEGORIZED_PIN_SVG_URL,
  CATEGORIZED_PIN_WITH_CATEGORY_SVG_URL,
  getCategoryBadgeSvgUrl,
} from '@utils/categorizedPinIcon'
import { pinnedSizeToIconScale } from '@utils/pinnedSize'
import type { Point } from '@type'

type PointIconProps = {
  point: Point
  size?: number
}

export default function PointIcon({ point, size = 22 }: PointIconProps) {
  const config = getPointIconConfig(point)
  const visualMode = getPointVisualMode(point)

  if ((visualMode === 'picture' || visualMode === 'icon') && config.imageUrl) {
    const imageOnly = point.markerType === 'pinned'
    const scale = imageOnly ? pinnedSizeToIconScale(point.pinnedSize) : 1
    const height = Math.round(size * scale)
    const width = Math.round(
      (visualMode === 'picture' ? size * 1.6 : size * 1.35) * scale,
    )
    return (
      <span
        aria-hidden
        style={{
          width,
          height,
          borderRadius: imageOnly ? 0 : 4,
          border: imageOnly ? 'none' : `2px solid ${config.color}`,
          overflow: 'hidden',
          display: 'inline-flex',
          flexShrink: 0,
          background: imageOnly ? 'transparent' : '#ffffff',
        }}
      >
        <img
          src={config.imageUrl}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </span>
    )
  }

  // Categorized pins: Icons/01-pin.svg, or pin + category badge / pin-with-category.
  if (point.markerType === 'categorized' || visualMode === 'pin') {
    const hasSub = Boolean(config.subcategoryId)
    const badgeSrc = getCategoryBadgeSvgUrl(config.subcategoryId)
    const height = Math.round(size * 1.15)
    const width = Math.round(size * (hasSub ? 1.2 : 1))

    // Prefer composing pin + badge asset; fall back to combined SVG template.
    if (hasSub && !badgeSrc) {
      return (
        <span aria-hidden style={{ width, height, flexShrink: 0, display: 'inline-block' }}>
          <img
            src={CATEGORIZED_PIN_WITH_CATEGORY_SVG_URL}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </span>
      )
    }

    return (
      <span
        aria-hidden
        style={{
          position: 'relative',
          width,
          height,
          flexShrink: 0,
          display: 'inline-block',
        }}
      >
        <img
          src={CATEGORIZED_PIN_SVG_URL}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {hasSub && badgeSrc ? (
          <img
            src={badgeSrc}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              right: -Math.round(size * 0.05),
              bottom: Math.round(size * 0.02),
              width: Math.round(size * 0.72),
              height: Math.round(size * 0.72),
              objectFit: 'contain',
            }}
          />
        ) : null}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.55),
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {config.emoji}
    </span>
  )
}
