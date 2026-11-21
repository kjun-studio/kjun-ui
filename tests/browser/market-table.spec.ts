import { test, expect, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureCases(options), options);
const events = (page: Page) => page.getByTestId('events');
const weight = (target: Locator) => target.evaluate(e => Number(getComputedStyle(e).fontWeight));
// The horizontal scroller inside a table box: web .kjun-table-scroll, Native the ScrollView's element.
const scrollBy = (box: Locator, x: number) => box.evaluate((root, x) => {
  const scroller = [root, ...root.querySelectorAll<HTMLElement>('*')].find(e => /auto|scroll/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth)!;
  scroller.scrollLeft = x;
  scroller.dispatchEvent(new Event('scroll'));
}, x);

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';

  test(`${platform}: MarketTable marks the sorted column like KjunTable and only sortable headers are buttons`, async ({ page }) => {
    await openFixture(page, platform, '', 'market-table');
    const main = page.getByTestId('main');
    if (web) {
      await expect(main.locator('th[aria-sort="descending"]')).toHaveText(/Price/);
      await expect(main.locator('th[aria-sort="none"]')).toHaveCount(2);
    }
    // The sorted header reads heavier than the others.
    expect(await weight(main.getByText('Price', { exact: true }))).toBeGreaterThan(await weight(main.getByText('Name', { exact: true })));
    await expect(page.getByTestId('narrow').getByRole('button', { name: 'Volume' })).toHaveCount(0);
    await main.getByRole('button', { name: 'Change' }).click();
    await expect(events(page)).toHaveText(JSON.stringify(['sort:change']));
  });

  test(`${platform}: MarketTable rows open from the keyboard and screen readers, and only rows that open answer`, async ({ page }) => {
    await openFixture(page, platform, '', 'market-table');
    const main = page.getByTestId('main'), bare = page.getByTestId('bare'), still = page.getByTestId('still');
    if (web) {
      const rows = main.locator('tbody tr');
      await rows.nth(0).focus(); await page.keyboard.press('Enter');
      await rows.nth(1).focus(); await page.keyboard.press(' ');
      await bare.locator('tbody tr').nth(2).focus(); await page.keyboard.press('Enter');
      await expect(events(page)).toHaveText(JSON.stringify(['open:a', 'open:b', 'bare:c']));
      expect(await rows.nth(0).evaluate(e => getComputedStyle(e).cursor)).toBe('pointer');
      // A table without onRowClick has no row stops and no pointer feedback.
      const row = still.locator('tbody tr').first();
      await expect(row).not.toHaveAttribute('tabindex');
      await row.hover();
      expect(await row.evaluate(e => [getComputedStyle(e).cursor, getComputedStyle(e).backgroundColor])).toEqual(['auto', 'rgba(0, 0, 0, 0)']);
      return;
    }
    // With toggles the identity cell is the row's open button; without them the row is.
    await main.getByRole('button', { name: 'Alpha', exact: true }).click();
    await bare.getByRole('button', { name: 'Gamma', exact: true }).click();
    await expect(events(page)).toHaveText(JSON.stringify(['open:a', 'bare:c']));
    // The toggles stay their own buttons beside the open button.
    expect(await main.getByRole('button', { name: /Alpha/ }).count()).toBeGreaterThan(1);
    await expect(still.getByRole('button', { name: 'Alpha', exact: true })).toHaveCount(0);
  });

  test(`${platform}: MarketTable activeKey fills the open row and marks it current`, async ({ page }) => {
    await openFixture(page, platform, '', 'market-table');
    const main = page.getByTestId('main');
    await expect(main.locator('[aria-current="true"]')).toHaveCount(0);
    await update(page, { active: 'b' });
    for (const box of [main, page.getByTestId('bare')]) {
      await expect(box.locator('[aria-current="true"]')).toHaveCount(1);
      await expect(box.locator('[aria-current="true"]')).toContainText('Beta');
    }
    if (web) expect(await main.locator('tbody tr[aria-current="true"]').evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  });

  test(`${platform}: MarketTable price columns with flash flash the way the price moved`, async ({ page }) => {
    await openFixture(page, platform, '', 'market-table');
    const main = page.getByTestId('main');
    await update(page, { bump: 100 });
    if (web) {
      await expect(main.locator('.kjun-price-cell').first()).toHaveClass(/kjun-price-flash-up(\s|$)/);
      await update(page, { bump: 0 });
      await expect(main.locator('.kjun-price-cell').first()).toHaveClass(/kjun-price-flash-down/);
      return;
    }
    // Native draws the move's colour on an overlay beside the digits that fades out.
    // The digits roll to the new price, so the overlay is found as the absolute layer that holds digits.
    const overlay = () => main.evaluate(root => [...root.querySelectorAll('*')].filter(n => getComputedStyle(n).position === 'absolute' && /\d/.test(n.textContent || ''))
      .map(n => Number(getComputedStyle(n).opacity)).reduce((a, b) => Math.max(a, b), 0));
    await expect.poll(overlay).toBeGreaterThan(0.5);
    await expect.poll(overlay, { timeout: 3000 }).toBe(0);
  });

  test(`${platform}: MarketTable keeps the toggles and name in view while columns scroll sideways`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await openFixture(page, platform, '', 'market-table');
    const narrow = page.getByTestId('narrow'), off = page.getByTestId('narrow-off');
    const x = (box: Locator, text: string) => box.getByText(text, { exact: true }).first().evaluate(e => e.getBoundingClientRect().left);
    const before = await x(narrow, 'Alpha'), heart = await x(narrow, 'Name'), loose = await x(off, 'Alpha');
    await scrollBy(narrow, 120); await scrollBy(off, 120);
    await expect.poll(() => x(narrow, 'Alpha')).toBeCloseTo(before, 0);
    await expect.poll(() => x(narrow, 'Name')).toBeCloseTo(heart, 0);
    await expect.poll(() => x(off, 'Alpha')).toBeLessThan(loose - 100);
    if (web) {
      // Once scrolled, the identity column casts its edge; at the start it does not.
      const edge = () => narrow.locator('td[data-pin-edge]').first().evaluate(e => getComputedStyle(e).boxShadow);
      await expect.poll(edge).not.toBe('none');
      await scrollBy(narrow, 0);
      await expect.poll(edge).toBe('none');
    }
  });

  test(`${platform}: MarketTable rows part with the lighter divider, divider={false} drops them, and a phone keeps toggles and names in their columns`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await openFixture(page, platform, '', 'market-table');
    // Bottom borders inside a table box: the header line first, then each row's.
    const lines = (box: Locator) => box.evaluate(root => [...root.querySelectorAll('*')].map(e => getComputedStyle(e))
      .filter(s => s.borderBottomStyle === 'solid' && s.borderBottomWidth !== '0px').map(s => s.borderBottomColor));
    const main = await lines(page.getByTestId('main')), still = await lines(page.getByTestId('still'));
    expect(main.length).toBeGreaterThan(1);
    expect(main.at(-1)).not.toBe(main[0]);
    expect(still[0]).toBe(main[0]);
    expect(still.at(-1)).toBe('rgba(0, 0, 0, 0)');
    // The header marks sit over the row toggles, and the toggles sit on the row's vertical centre.
    const narrow = page.getByTestId('narrow');
    const marks = await narrow.evaluate(root => {
      const boxes = [...root.querySelectorAll('svg')].map(svg => svg.getBoundingClientRect()), row = root.querySelector('[aria-label*="Alpha"]')!.getBoundingClientRect();
      const name = [...root.querySelectorAll('*')].find(e => e.textContent === 'Alpha' && !e.children.length)!;
      let cell: Element = name; while (cell.parentElement && cell.getBoundingClientRect().height < 60) cell = cell.parentElement;
      const c = cell.getBoundingClientRect();
      return { header: boxes[0].left + boxes[0].width / 2, toggle: row.left + row.width / 2, toggleMiddle: row.top + row.height / 2, rowMiddle: c.top + c.height / 2 };
    });
    expect(Math.abs(marks.header - marks.toggle)).toBeLessThan(2);
    expect(Math.abs(marks.toggleMiddle - marks.rowMiddle)).toBeLessThan(3);
    // A long name ends with an ellipsis inside its column instead of running over the price.
    const long = page.getByTestId('long');
    const fit = await long.evaluate(root => {
      const leaf = (text: string) => [...root.querySelectorAll<HTMLElement>('*')].find(e => e.textContent === text && !e.children.length)!;
      return { nameEnd: leaf('A very long asset name that never fits').getBoundingClientRect().right, priceStart: leaf('1,234,567').getBoundingClientRect().left };
    });
    expect(fit.nameEnd).toBeLessThanOrEqual(fit.priceStart);
  });
}
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a column's own renderer (Vue 3: a cell-<key> slot) draws that column and leaves the built-in cells to the rest`, async ({ page }) => {
    await openFixture(page, platform, '', 'market-table');
    const table = page.getByTestId('custom-cell');
    for (const id of ['a', 'b', 'c']) await expect(table.getByText('custom:' + id, { exact: true })).toBeVisible();
    if (platform === 'vue3') await expect(table.getByText('render:a', { exact: true })).toBeVisible();
    // The price column keeps its built-in cell with the app's formatter, and the identity its name.
    // (Native Web also keeps a hidden copy of a flashing price, so the first visible one is enough.)
    await expect(table.getByText('84,200', { exact: true }).first()).toBeVisible();
    await expect(table.getByText('Alpha', { exact: true }).first()).toBeVisible();
  });
}
