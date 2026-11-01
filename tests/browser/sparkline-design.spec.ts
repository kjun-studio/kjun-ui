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
    // The end dot has no ring, so it never shows a surface-colored halo on a tinted row.
    expect(await svg('baseline').locator('circle').getAttribute('stroke')).toBeNull();
    // Stretched, the dots become round caps of a zero-length path that keep their screen size.
    await expect(svg('stretch').locator('circle')).toHaveCount(0);
    const caps = svg('stretch').locator('path');
    await expect(caps).toHaveCount(2);
    for (const cap of await caps.all()) {
      expect(await cap.getAttribute('stroke-linecap')).toBe('round');
      expect(await cap.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    }
    // Negative bars hang from a dashed zero line instead of growing from the minimum.
    const zero = Number(await svg('negative').locator('line').getAttribute('y1'));
    const [down, up] = await svg('negative').locator('rect').all();
    expect(Number(await down.getAttribute('y'))).toBeCloseTo(zero, 2);
    expect(Number(await up.getAttribute('y')) + Number(await up.getAttribute('height'))).toBeCloseTo(zero, 2);
    // A market sparkline column reads each row's baseline field and shares one range.
    const market = page.getByTestId('market').locator('svg.kjun-sparkline, svg').filter({ has: page.locator('polyline') });
    await expect(market).toHaveCount(2);
    for (const chart of await market.all()) await expect(chart.locator('line')).toHaveCount(1);
    const tops = await Promise.all((await market.all()).map(async chart => Math.min(...(await chart.locator('polyline').getAttribute('points'))!.split(' ').map(p => Number(p.split(',')[1])))));
    expect(tops[0]).toBeGreaterThan(tops[1] + 4);
  });
}
