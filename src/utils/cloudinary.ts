import { Cloudinary } from '@cloudinary/url-gen'
import { fill } from '@cloudinary/url-gen/actions/resize'

export type CloudinaryUploadResult = {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  format: string
}

function requiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Missing ${name}. Add it to .env.local (see .env.example).`,
    )
  }
  return value.trim()
}

/** True when cloud name is configured (delivery URLs can be built). */
export function isCloudinaryConfigured(): boolean {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  return typeof cloudName === 'string' && cloudName.trim().length > 0
}

/** True when unsigned browser uploads are configured. */
export function canUploadToCloudinary(): boolean {
  return (
    isCloudinaryConfigured() &&
    typeof import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET === 'string' &&
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET.trim().length > 0
  )
}

function getCloudinary(): Cloudinary {
  return new Cloudinary({
    cloud: { cloudName: requiredEnv('VITE_CLOUDINARY_CLOUD_NAME') },
    url: { secure: true },
  })
}

export type CloudinaryImageOptions = {
  /** Crop/resize width in px. */
  width?: number
  /** Crop/resize height in px. */
  height?: number
}

/**
 * Build a delivery URL from a Cloudinary public id
 * (e.g. `miami-map/fifaMuseum`) or return absolute http(s) URLs unchanged.
 */
export function getCloudinaryImageUrl(
  publicIdOrUrl: string,
  options: CloudinaryImageOptions = {},
): string {
  const value = publicIdOrUrl.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) {
    return value
  }

  const image = getCloudinary().image(value)
  if (options.width || options.height) {
    image.resize(
      fill()
        .width(options.width ?? options.height!)
        .height(options.height ?? options.width!),
    )
  }
  return image.toURL()
}

type CloudinaryUploadApiResponse = {
  public_id: string
  url: string
  secure_url: string
  width: number
  height: number
  format: string
  error?: { message?: string }
}

/**
 * Upload an image with an unsigned upload preset (safe for the browser).
 * Never put `CLOUDINARY_API_SECRET` in Vite env — it would ship to users.
 */
export async function uploadImageToCloudinary(
  file: File | Blob,
  options: { folder?: string; publicId?: string } = {},
): Promise<CloudinaryUploadResult> {
  const cloudName = requiredEnv('VITE_CLOUDINARY_CLOUD_NAME')
  const uploadPreset = requiredEnv('VITE_CLOUDINARY_UPLOAD_PRESET')
  const folder =
    options.folder?.trim() ||
    import.meta.env.VITE_CLOUDINARY_FOLDER?.trim() ||
    undefined

  const body = new FormData()
  body.append('file', file)
  body.append('upload_preset', uploadPreset)
  if (folder) body.append('folder', folder)
  if (options.publicId?.trim()) body.append('public_id', options.publicId.trim())

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body },
  )

  const data = (await response.json()) as CloudinaryUploadApiResponse
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Cloudinary upload failed (${response.status})`)
  }

  return {
    publicId: data.public_id,
    url: data.url,
    secureUrl: data.secure_url,
    width: data.width,
    height: data.height,
    format: data.format,
  }
}
