import { expect, test, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const box = async (locator: Locator) => (await locator.boundingBox())!;
const centre = (b: { y: number; height: number }) => b.y + b.height / 2;

for (const platform of ['react', 'vue3', 'native']) {
  // The badge's own box: Native Web nests the label text inside the padded badge view.
  const badge = (scope: Locator, text: string) => platform === 'native' ? scope.getByText(text, { exact: true }).locator('..') : scope.getByText(text, { exact: true });
  test(`${platform}: the app's status sits after a price, before a list row's change and after a table price`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'price-status');

    // A standalone price cell keeps its 8px flash padding; the status sits 6px beyond it, centred on the number.
    const cell = page.getByTestId('cell');
    const price = await box(cell.getByText('182,500원', { exact: true })), close = await box(badge(cell, '종가'));
    expect(Math.round(close.x - (price.x + price.width))).toBe(8 + 6);
    expect(Math.abs(centre(close) - centre(price))).toBeLessThanOrEqual(1);
    expect(Math.round(close.height)).toBe(16);

    // KJUN draws no status of its own: a stale price without one has no badge.
    const bare = page.getByTestId('bare');
    await expect(bare.getByText('42,350원', { exact: true })).toBeVisible();
    await expect(bare.getByText(/종가|지연/)).toHaveCount(0);

    // The list puts the row's status before its change; only the row the app marks has one.
    const list = page.getByTestId('list');
    await expect(list.getByText('지연', { exact: true })).toHaveCount(1);
    const delayed = await box(badge(list, '지연')), change = await box(list.getByText('-0.82%', { exact: true }));
    expect(delayed.x + delayed.width).toBeLessThan(change.x);
    expect(Math.abs(centre(delayed) - centre(change))).toBeLessThanOrEqual(1);
    expect(Math.round(delayed.height)).toBe(16);

    // The table puts it 6px after the price column's value (no flash padding there) on the same line.
    const table = page.getByTestId('table');
    await expect(table.getByText('지연', { exact: true })).toHaveCount(1);
    const tablePrice = await box(table.getByText('182,500원', { exact: true })), tableStatus = await box(badge(table, '지연'));
    expect(Math.round(tableStatus.x - (tablePrice.x + tablePrice.width))).toBe(6);
    expect(Math.abs(centre(tableStatus) - centre(tablePrice))).toBeLessThanOrEqual(1);
  });
}
