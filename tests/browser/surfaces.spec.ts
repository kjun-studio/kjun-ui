import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.17.0: ButtonGroup label fit and bar surfaces, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 2000 });
      await openFixture(page, platform, '', 'surfaces');
    });

    test('group labels stay on one line when the weights use different faces', async ({ page }) => {
      test.skip(platform !== 'native', 'Native per-weight faces');
      const area = section(page, 'group-fonts');
      // Every shown label (not the invisible width reservations) keeps a single line.
      const heights = await area.getByText(/^(Wishlist 3|Achieved 1)$/).evaluateAll(all => all
        .filter(n => getComputedStyle(n).opacity !== '0')
        .map(n => ({ height: n.getBoundingClientRect().height, line: parseFloat(getComputedStyle(n).lineHeight) })));
      expect(heights.length).toBeGreaterThanOrEqual(4);
      for (const { height, line } of heights) expect(height).toBeLessThan(line * 1.5);
    });

    // The first painted background behind a text: the bar's own, or the page's when the bar is transparent.
    const paintBehind = (page: Page, text: string) => section(page, 'bars').getByText(text, { exact: true }).first().evaluate(el => {
      for (let n: Element | null = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') return c; }
      return '';
    });

    test('bars without a surface show the page background, and the default bar keeps its surface', async ({ page }) => {
      for (const text of ['Plain header', 'Plain home', 'Plain actions']) expect(await paintBehind(page, text)).toBe('rgb(240, 240, 240)');
      expect(await paintBehind(page, 'Card header')).not.toBe('rgb(240, 240, 240)');
    });

    test('group labels keep their own width instead of being squeezed to the reserved cell', async ({ page }) => {
      test.skip(platform !== 'native', 'Native label overlay');
      const area = section(page, 'group-fonts');
      // A shown label is as wide as its text, so a 1px measuring difference on a device can neither wrap nor clip it.
      const fits = await area.getByText(/^(Wishlist 3|Achieved 1)$/).evaluateAll(all => all
        .filter(n => getComputedStyle(n).opacity !== '0')
        .map(n => { const range = document.createRange(); range.selectNodeContents(n); return Math.abs(n.getBoundingClientRect().width - range.getBoundingClientRect().width); }));
      expect(fits.length).toBeGreaterThanOrEqual(4);
      for (const gap of fits) expect(gap).toBeLessThan(1);
    });
  });
}
