import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { typography } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed responsive thresholds govern KPI and form columns at boundaries`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'typography');
    for (const delta of [-1, 0, 1]) {
      await page.setViewportSize({ width: tokens.responsive.kpiHero + delta, height: 1000 });
      await typography(page.getByTestId('hero').getByText('1,234,567,890', { exact: true }), delta <= 0 ? tokens.typography.displayMd : tokens.typography.displayLg);
      await page.setViewportSize({ width: tokens.responsive.kpiRow + delta, height: 1000 });
      await typography(page.getByTestId('row').getByText('12,345', { exact: true }), delta <= 0 ? tokens.typography.numberLg : tokens.typography.displaySm);
    }
    await openFixture(page, platform, '', 'visual-reaudit');
    const fields = page.getByTestId('form-columns').locator(':scope > * > *');
    for (const delta of [-1, 0, 1]) {
      await page.setViewportSize({ width: tokens.responsive.formColumns + delta, height: 1000 });
      await expect.poll(async () => {
        const a = (await fields.nth(0).boundingBox())!, b = (await fields.nth(1).boundingBox())!;
        return Math.abs(a.y - b.y) < 1;
      }).toBe(delta >= 0);
    }
  });
}
