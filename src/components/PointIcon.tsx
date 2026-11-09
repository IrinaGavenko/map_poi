import { getPointIconConfig, getPointVisualMode } from '@utils/pointIcons'
import type { Point } from '@type'

type PointIconProps = {
  point: Point
  size?: number
}

export default function PointIcon({ point, size = 22 }: PointIconProps) {
  const config = getPointIconConfig(point)
  const visualMode = getPointVisualMode(point)

  if ((visualMode === 'picture' || visualMode === 'icon') && config.imageUrl) {
    const width = visualMode === 'picture' ? Math.round(size * 1.6) : Math.round(size * 1.35)
    return (
      <span
        aria-hidden
        style={{
          width,
          height: size,
          borderRadius: 4,
          border: `2px solid ${config.color}`,
          overflow: 'hidden',
          display: 'inline-flex',
          flexShrink: 0,
          background: '#ffffff',
        }}
      >
        <img
          src={config.imageUrl}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
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
