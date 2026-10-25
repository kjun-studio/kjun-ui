import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.16.0 adopter requests: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
// The nearest ancestor (or self) that paints rounded corners.
const cornerOf = (target: Locator) => target.evaluate(el => {
  for (let n: Element | null = el; n; n = n.parentElement) { const r = getComputedStyle(n).borderTopLeftRadius; if (r !== '0px') return r; }
  return '0px';
});
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 2000 });
      await openFixture(page, platform, '', 'rounded');
      await expect(section(page, 'cards')).toBeVisible();
    });

    test('cards take the xl radius and lg stays 16', async ({ page }) => {
      expect(await cornerOf(section(page, 'cards').getByText('XL body', { exact: true }))).toBe('24px');
      expect(await cornerOf(section(page, 'cards').getByText('LG body', { exact: true }))).toBe('16px');
    });
  });
}
