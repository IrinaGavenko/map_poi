import { getPointIconConfig, getPointVisualMode } from '@utils/pointIcons'
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

  const subSize = Math.round(size * 0.55)

  return (
    <span
      aria-hidden
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      <span
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: config.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.55),
          lineHeight: 1,
        }}
      >
        {config.emoji}
      </span>
      {config.subcategoryId && config.subcategoryColor && config.subcategoryEmoji ? (
        <span
          style={{
            position: 'absolute',
            top: -Math.round(subSize * 0.15),
            right: -Math.round(subSize * 0.25),
            width: subSize,
            height: subSize,
            borderRadius: '50%',
            background: config.subcategoryColor,
            border: '2px solid #ffffff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: Math.round(subSize * 0.55),
            lineHeight: 1,
            boxSizing: 'border-box',
          }}
        >
          {config.subcategoryEmoji}
        </span>
      ) : null}
    </span>
  )
}
