import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px, typography } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed market typography and skeleton lines share scalable roles`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'visual-reaudit');
    const loaded = page.getByTestId('loaded');
    for (const scale of platform === 'native' ? [1] : [1, 1.25]) {
      await page.evaluate(scale => { document.documentElement.style.fontSize = 16 * scale + 'px'; }, scale);
      await typography(loaded.getByText('한빛테크', { exact: true }), tokens.typography.body, scale);
      await typography(loaded.getByText('HBT', { exact: true }), tokens.typography.caption, scale);
      if (platform !== 'native') await expect(page.getByTestId('loading').locator('.kjun-market-skeleton-identity').first())
        .toHaveCSS('grid-template-rows', `${tokens.typography.body.lineHeightPx * scale}px ${tokens.typography.caption.lineHeightPx * scale}px`);
    }
    const sort = loaded.getByText('현재가', { exact: true });
    await sort.click();
    await expect(page.getByTestId('state')).toContainText('"sort":"price"');
    await captureReview(loaded, { path: testInfo.outputPath('market-typography.png') });
  });
}
