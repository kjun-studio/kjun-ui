export function safeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch (_) {
    return null
  }
}

// Vue 2 renders `javascript:` and `data:` hrefs as given, so app-supplied links pass through this.
// Relative paths, fragments and queries stay; only web, mail and phone schemes are kept.
export function safeLinkHref(value) {
  if (typeof value !== 'string' || !value.trim()) return undefined
  const scheme = value.replace(/[\u0000-\u0020]/g, '').match(/^([a-z][a-z0-9+.-]*):/i)
  return !scheme || ['http', 'https', 'mailto', 'tel'].includes(scheme[1].toLowerCase()) ? value : undefined
}
