import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Unmounting an owner must take its portaled layer with it, also when the layer is mid exit animation.
const layers = '.kjun-floating, .kjun-modal-overlay, .kjun-drawer-overlay';
for (const platform of ['react', 'vue3']) for (const kind of ['select', 'popover', 'modal', 'drawer']) for (const moment of ['open', 'closing']) {
  test(`${platform}: ${kind} unmounted while ${moment} leaves no layer behind`, async ({ page }) => {
    await openFixture(page, platform, '?kind=' + kind, 'layer-unmount');
    await page.evaluate(() => (window as any).layerUnmount.open());
    await expect(page.locator(layers)).toHaveCount(1);
    if (moment === 'closing') {
      await page.evaluate(() => (window as any).layerUnmount.close());
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => (window as any).layerUnmount.destroy());
    await expect(page.locator(layers)).toHaveCount(0);
    await page.waitForTimeout(500);
    await expect(page.locator(layers)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).not.toBe('hidden');
    expect(await page.evaluate(() => [...document.querySelectorAll('[inert], [aria-hidden="true"]')].filter(el => !el.closest('svg') && el.tagName !== 'svg').length)).toBe(0);
  });
}
