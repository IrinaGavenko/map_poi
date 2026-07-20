import { getPointCategoryId, getPointIconConfig } from '@utils/pointIcons'
import {
  getCategoryImageUrl,
  getCategoryRenderType,
  getPinEmojiForCategory,
} from '@type/categories'
import type { Point } from '@type'

type PointIconProps = {
  point: Point
  size?: number
}

export default function PointIcon({ point, size = 22 }: PointIconProps) {
  const categoryId = getPointCategoryId(point)
  const { color } = getPointIconConfig(point)
  const renderType = getCategoryRenderType(categoryId)
  const imageUrl = getCategoryImageUrl(categoryId)

  if ((renderType === 'picture' || renderType === 'icon') && imageUrl) {
    const width = renderType === 'picture' ? Math.round(size * 1.6) : Math.round(size * 1.35)
    return (
      <span
        aria-hidden
        style={{
          width,
          height: size,
          borderRadius: 4,
          border: `2px solid ${color}`,
          overflow: 'hidden',
          display: 'inline-flex',
          flexShrink: 0,
          background: '#ffffff',
        }}
      >
        <img
          src={imageUrl}
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
        background: color,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.55),
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {getPinEmojiForCategory(categoryId)}
    </span>
  )
}
