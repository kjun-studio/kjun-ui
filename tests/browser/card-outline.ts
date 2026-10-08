import type { Locator } from '@playwright/test';

export const cardOutline = (card: Locator, platform: string) => card.evaluate((element, platform) => {
  if (platform !== 'native') return getComputedStyle(element, '::after').boxShadow;
  return Array.from(element.children).map(child => getComputedStyle(child).boxShadow)
    .find(shadow => shadow.includes('inset')) || 'none';
}, platform);
