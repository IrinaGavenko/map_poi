import { getPointIconConfig, getPointVisualMode } from '@utils/pointIcons'
import {
  getTintedIconDataUrl,
  getTintedPinDataUrl,
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
    const imageOnly =
      point.markerType === 'pinned' || point.markerType === 'custom'
    const scale =
      point.markerType === 'pinned' ? pinnedSizeToIconScale(point.pinnedSize) : 1
    const height = Math.round(size * scale)
    const width = Math.round(
      (point.markerType === 'pinned'
        ? size * 1.6
        : point.markerType === 'custom'
          ? size
          : size * 1.35) * scale,
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

  // Categorized pins: tinted pin + optional subcategory badge from viewIcon.
  if (point.markerType === 'categorized' || visualMode === 'pin') {
    const hasSub = Boolean(config.subcategoryId)
    const pinSrc = getTintedPinDataUrl(config.color)
    const rootBadgeUrl = config.iconSvg
      ? getTintedIconDataUrl(config.iconSvg, config.color)
      : null
    const subBadgeUrl = config.subcategoryIconSvg
      ? getTintedIconDataUrl(
          config.subcategoryIconSvg,
          config.subcategoryColor || config.color,
        )
      : null

    const height = Math.round(size * 1.15)
    const width = Math.round(size * (hasSub ? 1.2 : 1))

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
          src={pinSrc}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {rootBadgeUrl ? (
          <img
            src={rootBadgeUrl}
            alt=""
            draggable={false}
            style={{
              position: 'absolute',
              left: '50%',
              top: '42%',
              width: Math.round(size * 0.55),
              height: Math.round(size * 0.55),
              transform: 'translate(-50%, -50%)',
              objectFit: 'contain',
            }}
          />
        ) : null}
        {hasSub && subBadgeUrl ? (
          <img
            src={subBadgeUrl}
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
