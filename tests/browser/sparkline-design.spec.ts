import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: sparklines centre flat series, break gaps, show empty, mark baselines and draw bars`, async ({ page }) => {
    await openFixture(page, platform, '', 'sparkline-design');
    const svg = (id: string) => page.getByTestId(id).locator('svg').first();
    // A flat series sits on the vertical middle, not the bottom edge.
    const flat = await svg('flat').locator('polyline').getAttribute('points');
    const middle = Number(await svg('flat').getAttribute('height')) / 2;
    expect(flat!.split(' ').every(p => Math.abs(Number(p.split(',')[1]) - middle) < 0.01)).toBe(true);
    // Missing values split the line into separate runs.
    await expect(svg('gaps').locator('polyline')).toHaveCount(2);
    // No data draws one dashed line.
    await expect(svg('empty').locator('line')).toHaveCount(1);
    expect(await svg('empty').locator('line').getAttribute('stroke-dasharray')).toBeTruthy();
    // The baseline is a dashed line and the end dot marks the last value.
    await expect(svg('baseline').locator('line')).toHaveCount(1);
    await expect(svg('baseline').locator('circle')).toHaveCount(1);
    // A fixed range keeps a 0.4% move small.
    const range = (await svg('range').locator('polyline').getAttribute('points'))!.split(' ').map(p => Number(p.split(',')[1]));
    expect(Math.abs(range[0] - range[1])).toBeLessThan(2);
    // The bar variant draws one bar per value.
    await expect(svg('bars').locator('rect')).toHaveCount(4);
  });
}
