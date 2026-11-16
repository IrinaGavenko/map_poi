import { getPointIconConfig, getPointVisualMode } from '@utils/pointIcons'
import { getCategoryTitle, getRootCategoryId, isRootCategory } from '@type/categories'
import { resolveGoogleMapsUrl } from '@utils/googleMapsLink'
import { resolvePublicUrl } from '@utils/publicUrl'
import type { Point } from '@type'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function buildPopupContent(point: Point): string {
  const config = getPointIconConfig(point)
  const visualMode = getPointVisualMode(point)
  const color = config.color
  const googleMapsHref = resolveGoogleMapsUrl({
    googleLink: point.googleLink,
    coordinates: point.coordinates,
  })
  const categoryTags = new Set<string>()
  for (const id of point.categories) {
    const rootId = getRootCategoryId(id)
    categoryTags.add(rootId)
    if (!isRootCategory(id)) categoryTags.add(id)
  }
  const categories = [...categoryTags]
    .map(
      (type) =>
        `<span class="map-popup-tag" style="--popup-accent:${color}">${escapeHtml(getCategoryTitle(type))}</span>`,
    )
    .join('')
  const galleryUrl = point.pictures[0] ? resolvePublicUrl(point.pictures[0]) : ''
  const image = galleryUrl
    ? `<div class="map-popup-media"><img class="map-popup-image" src="${escapeHtml(galleryUrl)}" alt="" draggable="false" /></div>`
    : `<div class="map-popup-media map-popup-media--empty" style="--popup-accent:${color}"></div>`
  const logo =
    (visualMode === 'icon' || visualMode === 'picture') && config.imageUrl
      ? `<span class="map-popup-icon map-popup-icon--image${point.markerType === 'pinned' ? ' map-popup-icon--image-only' : ''}" aria-hidden style="border-color:${color}">
          <img src="${escapeHtml(config.imageUrl)}" alt="" draggable="false" />
        </span>`
      : `<span class="map-popup-icon" aria-hidden style="background:${color}">${escapeHtml(config.emoji)}</span>`
  const moreInfo = point.link
    ? `<a class="map-popup-link" href="${escapeHtml(point.link)}" target="_blank" rel="noopener noreferrer">
        <span class="map-popup-link-icon" aria-hidden>↗</span>
        More info
      </a>`
    : ''
  const description = point.description
    ? `<p class="map-popup-description">${escapeHtml(point.description)}</p>`
    : ''
  const googleMaps = `<a class="map-popup-link map-popup-link--secondary" href="${escapeHtml(googleMapsHref)}" target="_blank" rel="noopener noreferrer">
        <span class="map-popup-link-icon" aria-hidden>📍</span>
        Open in Google Maps
      </a>`

  return `
    <div class="map-popup" style="--popup-accent:${color}">
      ${image}
      <div class="map-popup-body">
        <div class="map-popup-heading">
          ${logo}
          <div class="map-popup-heading-text">
            <h3 class="map-popup-title">${escapeHtml(point.name)}</h3>
            <div class="map-popup-tags">${categories}</div>
          </div>
        </div>
        ${description}
        <div class="map-popup-actions">
          ${moreInfo}
          ${googleMaps}
        </div>
      </div>
    </div>
  `
}
