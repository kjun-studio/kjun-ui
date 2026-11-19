import { test, expect, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureCases(options), options);
// The fill layer is the text's previous sibling on every platform (web .kjun-heat-layer, Native the absolute View).
const layer = (cell: Locator) => cell.evaluate(e => { const l = getComputedStyle(e.parentElement!.firstElementChild!); return { color: l.backgroundColor, opacity: Number(l.opacity) }; });
const fills = (bar: Locator) => bar.evaluate(e => [...e.querySelectorAll('*')].map(n => getComputedStyle(n).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)'));
const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(0.01);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: HeatmapCell splits at its centre on one scale and shows a dash for a missing value`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-cells');
    const heat = page.getByTestId('heat'), at = (text: string) => heat.getByText(text, { exact: true });
    const up = await layer(at('+2%')), top = await layer(at('+10%')), down = await layer(at('-1%')), far = await layer(at('-4%')), zero = await layer(at('0%'));
    // Above the centre is the up colour, below it the down colour, even though 0 and +2 sit below the range's middle (2.5).
    expect(up.color).toBe(top.color);
    expect(down.color).toBe(far.color);
    expect(up.color).not.toBe(down.color);
    near(up.opacity, 0.08 + 0.32 * 0.2);
    near(top.opacity, 0.4);
    // -4 is 4 of 10 on the shared scale, not 4 of 5.
    near(far.opacity, 0.08 + 0.32 * 0.4);
    expect(zero.opacity).toBe(1);
    const missing = page.getByTestId('heat-missing');
    await expect(missing.getByText('—', { exact: true })).toHaveCount(2);
    await expect(missing).not.toContainText('NaN');
    // A missing cell keeps the neutral fill of a cell at the centre, so a grid keeps its rhythm.
    expect((await layer(missing.getByText('—', { exact: true }).first())).color).toBe(zero.color);
  });

  test(`${platform}: ProgressCell shows and reads valueText, is named, and resolves a custom colour`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-cells');
    const progress = page.getByTestId('progress');
    const named = progress.getByRole('progressbar', { name: 'B팀 진척' });
    // The label is end-aligned so a column's digits and % line up.
    expect(await progress.getByText('12/20건', { exact: true }).evaluate(e => getComputedStyle(e).textAlign)).toMatch(/^(end|right)$/);
    await expect(named).toHaveAttribute('aria-valuenow', '60');
    await expect(named).toHaveAttribute('aria-valuetext', '12/20건');
    await expect(progress).toContainText('12/20건');
    await expect(progress).not.toContainText('60%');
    const reference = await fills(progress.getByRole('progressbar', { name: '기준' }));
    expect(await fills(progress.getByRole('progressbar', { name: '색 없는 custom' }))).toEqual(reference);
    expect(await fills(progress.getByRole('progressbar', { name: 'customColor만' }))).toContain('rgb(1, 2, 3)');
  });

  test(`${platform}: PriceCell flashes the way the price moved and reads a loading price`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-cells');
    const text = page.getByTestId('price-text'), background = page.getByTestId('price-bg');
    // Web reads hidden text; Native names the placeholder (its accessibility label).
    if (platform === 'native') await expect(page.getByTestId('price-loading').getByLabel('로딩 중', { exact: true })).toHaveCount(1);
    else await expect(page.getByTestId('price-loading')).toContainText('로딩 중');
    if (platform === 'native') {
      // Native draws the move's colour on an overlay that fades out.
      const overlay = (box: Locator) => box.evaluate(e => [...e.querySelectorAll('*')].filter(n => n.getAttribute('aria-hidden') === 'true' || getComputedStyle(n).position === 'absolute')
        .map(n => Number(getComputedStyle(n).opacity)).reduce((a, b) => Math.max(a, b), 0));
      await update(page, { price: 84300 });
      await expect.poll(() => overlay(text)).toBeGreaterThan(0.5);
      await expect.poll(() => overlay(background)).toBeGreaterThan(0.2);
      await expect.poll(() => overlay(text), { timeout: 3000 }).toBe(0);
      await expect.poll(() => overlay(background), { timeout: 3000 }).toBe(0);
      return;
    }
    const cell = (box: Locator) => box.locator('.kjun-price-cell');
    // Only a background flash keeps room around the digits.
    expect(await cell(text).evaluate(e => getComputedStyle(e).paddingLeft)).toBe('0px');
    expect(await cell(background).evaluate(e => getComputedStyle(e).paddingLeft)).toBe('8px');
    await update(page, { price: 84300 });
    await expect(cell(text)).toHaveClass(/kjun-price-flash-up(\s|$)/);
    await expect(cell(background)).toHaveClass(/kjun-price-flash-up-bg/);
    // The class goes when its animation ends, and a fall flashes down.
    await expect(cell(text)).not.toHaveClass(/kjun-price-flash/, { timeout: 3000 });
    await update(page, { price: 84100 });
    await expect(cell(text)).toHaveClass(/kjun-price-flash-down/);
  });
}
