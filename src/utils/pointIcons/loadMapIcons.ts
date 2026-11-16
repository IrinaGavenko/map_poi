import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Point } from '@type'
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_PICTURE,
  getCategoriesRegistry,
  getCategoryColor,
  getCategoryConfig,
  getCategoryImageUrl,
  getCategoryListIcon,
  getCategoryVisualMode,
} from '@type/categories'
import {
  createCategorizedPinImageData,
  createClusterButtonImageData,
  createPinImageData,
  createRectMarkerImageData,
  type RectMarkerStyle,
} from './canvasMarkers'
import {
  CLUSTER_ICON_ID,
  CUSTOM_MARKER_SIZE,
  ICON_MARKER_HEIGHT,
  ICON_MARKER_WIDTH,
  PICTURE_MARKER_HEIGHT,
  PICTURE_MARKER_WIDTH,
  getPointIconConfig,
  getPointIconKey,
  getPointVisualMode,
  resolveViewIconEmoji,
  resolveViewIconSvg,
} from './config'

async function addOrReplaceImage(map: MapLibreMap, id: string, imageData: ImageData) {
  if (map.hasImage(id)) {
    map.removeImage(id)
  }
  map.addImage(id, imageData, { pixelRatio: 2 })
}

export async function loadMapIcons(map: MapLibreMap, points: Point[] = []): Promise<void> {
  const iconKeys = new Set<string>()

  for (const categoryId of Object.keys(getCategoriesRegistry())) {
    const config = getCategoryConfig(categoryId)
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
    } else if (config.type === 'categorized' || !config.type) {
      imageData = await createCategorizedPinImageData({
        pinColor: color,
        emoji: resolveViewIconEmoji(categoryId) || getCategoryListIcon(categoryId),
        iconSvg: resolveViewIconSvg(categoryId),
      })
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

    // Custom + pinned: draw the picture/SVG itself (no white framed matte).
    const markerStyle: RectMarkerStyle =
      point.markerType === 'pinned' || point.markerType === 'custom'
        ? 'image'
        : 'framed'

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
      const width =
        point.markerType === 'custom' ? CUSTOM_MARKER_SIZE : ICON_MARKER_WIDTH
      const height =
        point.markerType === 'custom' ? CUSTOM_MARKER_SIZE : ICON_MARKER_HEIGHT
      imageData = await createRectMarkerImageData(
        pictureUrl,
        color,
        width,
        height,
        markerStyle,
      )
    } else if (point.markerType === 'categorized') {
      imageData = await createCategorizedPinImageData({
        pinColor: color,
        emoji: config.emoji,
        iconSvg: config.iconSvg,
        subcategoryId: config.subcategoryId,
        subcategoryColor: config.subcategoryColor,
        subcategoryEmoji: config.subcategoryEmoji,
        subcategoryIconSvg: config.subcategoryIconSvg,
      })
    } else {
      imageData = createPinImageData(color, config.emoji)
    }

    await addOrReplaceImage(map, key, imageData)
    iconKeys.add(key)
  }

  const clusterImage = createClusterButtonImageData()
  await addOrReplaceImage(map, CLUSTER_ICON_ID, clusterImage)
}
