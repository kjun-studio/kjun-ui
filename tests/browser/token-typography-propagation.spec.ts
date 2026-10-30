import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { weightedTypography, typography } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed typography weights and tracking reach visible and measured labels`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 1400 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-followup');
    await weightedTypography(page.getByText('빈 상태 제목', { exact: true }), tokens.typography.cardTitle);
    await weightedTypography(page.getByText('빈 상태 설명', { exact: true }), tokens.typography.caption);
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) for (const family of ['group', 'filter']) {
      const section = page.getByTestId(`${family}-${size}`);
      const button = section.getByRole('button', { name: '두 번째 MMM', exact: true });
      const labels = button.getByText('두 번째 MMM', { exact: true });
      const spec = tokens.button.typography[size];
      await weightedTypography(labels.last(), spec, tokens.typography.label.fontWeight);
      await weightedTypography(labels.first(), spec);
      const before = await button.boundingBox();
      await button.click();
      await expect(section.locator('output')).toHaveText('b');
      await weightedTypography(labels.last(), spec);
      const after = await button.boundingBox();
      expect(after!.width).toBeCloseTo(before!.width, 1);
      const first = section.getByRole('button', { name: '첫 번째 WWW', exact: true });
      await weightedTypography(first.getByText('첫 번째 WWW', { exact: true }).last(), spec, tokens.typography.label.fontWeight);
    }
    const tab = page.getByTestId('tabs').getByRole('tab', { name: '두 번째 MMM', exact: true });
    const label = tab.getByText('두 번째 MMM', { exact: true }).last();
    await weightedTypography(label, tokens.typography.control, tokens.typography.label.fontWeight);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await weightedTypography(label, tokens.typography.control);
  });
}
