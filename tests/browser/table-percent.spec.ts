import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Native lays table columns out itself. A percent width is a share of the table's own width, as on Web.
// Native Web only; the one hidden frame before the table is measured is not observable here.
const columns = (page: Page) => page.evaluate(() => {
  const sheet = document.querySelector('[data-testid="sheet"]')!.getBoundingClientRect();
  const width = (text: string) => {
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) if (el.childElementCount === 0 && el.textContent === text) {
      // The header cell is the nearest ancestor with a width of its own in the header row.
      let cell: HTMLElement = el;
      while (cell.parentElement && getComputedStyle(cell.parentElement).flexDirection !== 'row') cell = cell.parentElement;
      while (cell.parentElement && cell.parentElement.childElementCount === 1) cell = cell.parentElement;
      return cell.getBoundingClientRect().width;
    }
    return 0;
  };
  const scroller = Array.from(document.querySelectorAll<HTMLElement>('*')).find(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'visible');
  return { sheet: sheet.width, month: width('월'), income: width('수입'), spend: width('지출'), overflows: !!scroller };
});
test('native: percent column widths share the table width and fit a narrow sheet', async ({ page }) => {
  await openFixture(page, 'native', '', 'table-percent');
  await expect.poll(async () => (await columns(page)).month).toBeGreaterThan(0);
  const c = await columns(page);
  expect(c.sheet).toBe(320);
  expect(Math.abs(c.month - 128)).toBeLessThan(1);
  expect(Math.abs(c.income - 96)).toBeLessThan(1);
  expect(Math.abs(c.spend - 96)).toBeLessThan(1);
  expect(c.overflows).toBe(false);
});

test('native: a percent column sits beside a fixed one and an unsized one takes the rest', async ({ page }) => {
  await openFixture(page, 'native', '?mixed', 'table-percent');
  await expect.poll(async () => (await columns(page)).income).toBeGreaterThan(0);
  const c = await columns(page);
  expect(Math.abs(c.month - 60)).toBeLessThan(1);
  expect(Math.abs(c.income - 160)).toBeLessThan(1);
  // The unsized column has the default 160 and nothing is spare (60 + 160 + 160 > 320), so the table scrolls as before.
  expect(Math.abs(c.spend - 160)).toBeLessThan(1);
  expect(c.overflows).toBe(true);
});
