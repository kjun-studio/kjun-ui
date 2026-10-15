import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Vue calls function refs before a new tree is attached; the domain color check must wait for the document.
test('vue3: domain expressions mounted with app colors report nothing', async ({ page }) => {
  await openFixture(page, 'vue3', '', 'domain-check');
  await expect(page.locator('.kjun-signed-value')).toBeVisible();
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
  expect(await page.evaluate(() => (window as any).domainErrors)).toEqual([]);
});

test('vue3: domain expressions without app colors report through the app error handler', async ({ page }) => {
  await openFixture(page, 'vue3', '?missing', 'domain-check');
  await expect.poll(() => page.evaluate(() => (window as any).domainErrors.length)).toBe(2);
  expect(await page.evaluate(() => (window as any).domainErrors[0])).toContain('Missing KJUN CSS domain colors');
});
