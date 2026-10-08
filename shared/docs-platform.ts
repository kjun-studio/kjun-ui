import type { PlatformName } from './demo-config';

export const platformStorageKey = 'kjun-docs-platform-v1';
export const isPlatform = (value: unknown): value is PlatformName =>
  value === 'vue2' || value === 'react' || value === 'native';

export function resolvePlatform(search: string, saved: unknown): PlatformName {
  const requested = new URLSearchParams(search).get('platform');
  return isPlatform(requested) ? requested : isPlatform(saved) ? saved : 'vue2';
}

/** Document links only. Hash links, external URLs and explicit platforms retain their meaning. */
export function platformHref(href: string, platform: PlatformName | null): string {
  if (!platform || !href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, 'https://kjun-docs.local');
  if (!isPlatform(url.searchParams.get('platform'))) url.searchParams.set('platform', platform);
  return url.pathname + url.search + url.hash;
}
