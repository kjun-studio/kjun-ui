import { expect, test, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
// KpiHero secondary metrics: on a narrow screen four metrics take two columns instead of
// squeezing into one row, where numbers broke between digits and labels between syllables.
const labels = ['평가 손익', '수익률', '보유 종목', '현금 비중'];
const tops = (page: Page) => Promise.all(labels.map(async label => Math.round((await page.getByText(label, { exact: true }).boundingBox())!.y)));
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: four secondary metrics take two columns on a narrow screen and one row above it`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openFixture(page, platform, '', 'kpi-secondary');
    await expect(page.getByText('평가 손익', { exact: true })).toBeVisible();
    let [a, b, c, d] = await tops(page);
    expect(b).toBe(a); expect(d).toBe(c); expect(c).toBeGreaterThan(a);
    // Each label and the amount keep to one line.
    const caption = tokens.typography.caption.lineHeightPx;
    for (const label of labels) expect((await page.getByText(label, { exact: true }).boundingBox())!.height).toBeLessThanOrEqual(caption + 1);
    const amount = page.getByText(/^₩?1,234,567$/).first();
    expect((await amount.boundingBox())!.height).toBeLessThanOrEqual(tokens.typography.numberMd.lineHeightPx + 1);
    await page.screenshot({ path: `artifacts/kpi-secondary-${platform}-320.png` });
    await page.setViewportSize({ width: tokens.responsive.kpiHeroSecondary + 120, height: 800 });
    await expect.poll(async () => new Set(await tops(page)).size).toBe(1);
  });
}
