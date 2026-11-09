/** Resolve a bundled/public path against Vite `base`. Absolute http(s) and root `/…` URLs are unchanged. */
export function resolvePublicUrl(url: string | null | undefined): string {
  if (!url) return ''
  const value = url.trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value) || value.startsWith('data:') || value.startsWith('/')) {
    return value
  }
  return `${import.meta.env.BASE_URL}${value.replace(/^\.\//, '')}`
}
