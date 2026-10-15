import type { PlatformName } from './demo-config';

export const platformStorageKey = 'kjun-docs-platform-v1';
export const isPlatform = (value: unknown): value is PlatformName =>
  value === 'vue3' || value === 'react' || value === 'native';
// Links and saved choices from before 0.6.0 named the Vue platform vue2.
const current = (value: unknown) => value === 'vue2' ? 'vue3' : value;

export function resolvePlatform(search: string, saved: unknown): PlatformName {
  const requested = current(new URLSearchParams(search).get('platform')), stored = current(saved);
  return isPlatform(requested) ? requested : isPlatform(stored) ? stored : 'vue3';
}

/** Document links only. Hash links, external URLs and explicit platforms retain their meaning. */
export function platformHref(href: string, platform: PlatformName | null): string {
  if (!platform || !href.startsWith('/') || href.startsWith('//')) return href;
  const url = new URL(href, 'https://kjun-docs.local');
  if (!isPlatform(url.searchParams.get('platform'))) url.searchParams.set('platform', platform);
  return url.pathname + url.search + url.hash;
}
