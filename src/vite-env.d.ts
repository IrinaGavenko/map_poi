/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDINARY_CLOUD_NAME: string
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string
  /** Optional folder prefix for uploads, e.g. `miami-map`. */
  readonly VITE_CLOUDINARY_FOLDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
