import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { thumbColor } from '../fixtures/additions-cases';

// 0.13.0 additions: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'additions');
      await expect(section(page, 'switch-thumb')).toBeVisible();
    });

    test('switch thumb uses switchThumbOn when set and onBrand otherwise', async ({ page }) => {
      const thumbs = section(page, 'switch-thumb').locator(platform === 'native' ? '[role="switch"] > div > div:last-child' : '.kjun-switch-thumb');
      await expect(thumbs.nth(0)).toHaveCSS('background-color', thumbColor);
      // The demo palette leaves onBrand unset, so it falls back to inverse (#FFFFFF).
      await expect(thumbs.nth(1)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });
  });
}
