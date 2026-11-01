import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const top = async (page: Page, text: string) => (await page.getByText(text, { exact: true }).first().boundingBox())!.y;

for (const platform of ['react', 'vue3', 'native']) {
  const web = platform !== 'native';
  test(`${platform}: sortable columns show their arrow, selection keeps the table still and expansion trails the row`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'table-refine');
    await expect(page.getByText('항목 1', { exact: true })).toBeVisible();
    // Sortable headers carry an arrow before they are sorted; the plain column has none.
    if (web) {
      await expect(page.locator('th', { hasText: '이름' }).locator('.kjun-table-sort-icon')).toHaveCount(1);
      await expect(page.locator('th', { hasText: '담당자' }).locator('svg')).toHaveCount(0);
      await page.getByRole('button', { name: '금액' }).click();
      await expect(page.locator('th', { hasText: '금액' })).toHaveAttribute('aria-sort', 'ascending');
      const sorted = await page.locator('th', { hasText: '금액' }).locator('button').evaluate(el => getComputedStyle(el).color);
      const quiet = await page.locator('th', { hasText: '이름' }).locator('button').evaluate(el => getComputedStyle(el).color);
      expect(sorted).not.toBe(quiet);
    }
    // Only sortable headers are buttons; the plain column reads as text on every platform.
    await expect(page.getByRole('button', { name: '담당자', exact: true })).toHaveCount(0);
    if (!web) {
      // Native spreads the spare width over unsized columns, so the grid reaches the container's edge.
      const name = (await page.getByText('항목 1', { exact: true }).first().boundingBox())!;
      const button = (await page.getByRole('button', { name: /행 확장|상세 보기/ }).first().boundingBox())!;
      expect(button.x + button.width).toBeGreaterThan(name.x + 500);
    }
    // The expand control is the row's last cell, after every data column.
    const amount = (await page.getByText('1,000', { exact: true }).first().boundingBox())!;
    const expand = (await page.getByRole('button', { name: /행 확장|상세 보기/ }).first().boundingBox())!;
    expect(expand.x).toBeGreaterThan(amount.x + amount.width);
    // Selecting swaps the search toolbar for the selection bar at the same height: the rows stay put.
    const before = await top(page, '항목 1');
    await page.getByRole('checkbox', { name: /1번 행 선택|행 선택/ }).first().click();
    await expect(page.getByText('1개 선택', { exact: false }).first()).toBeVisible();
    expect(Math.abs((await top(page, '항목 1')) - before)).toBeLessThanOrEqual(1);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    if (web) {
      const row = page.locator('tbody tr').first();
      const bg = await row.evaluate(el => getComputedStyle(el).backgroundColor);
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    }
    await page.getByRole('button', { name: '선택 해제', exact: true }).click();
    await expect(page.getByRole('textbox')).toHaveCount(1);
    expect(Math.abs((await top(page, '항목 1')) - before)).toBeLessThanOrEqual(1);
  });

  if (web) test(`${platform}: without maxHeight the header sticks to the page and marks when rows pass under it`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 500 });
    await openFixture(page, platform, '?page', 'table-refine');
    const scroller = page.locator('.kjun-table-scroll');
    await expect(scroller).toHaveAttribute('data-page-sticky', /.*/);
    await expect(scroller).not.toHaveAttribute('data-stuck', /.*/);
    await page.mouse.wheel(0, 260);
    await expect(scroller).toHaveAttribute('data-stuck', /.*/);
    expect(Math.round((await page.locator('thead').boundingBox())!.y)).toBe(0);
  });

  if (web) test(`${platform}: a sticky header strengthens its line once rows pass under it`, async ({ page }) => {
    await openFixture(page, platform, '', 'table-refine');
    const scroller = page.locator('.kjun-table-scroll');
    const line = () => page.locator('thead th').nth(1).evaluate(el => getComputedStyle(el).borderBottomColor);
    const rest = await line();
    await expect(scroller).not.toHaveAttribute('data-stuck', /.*/);
    await scroller.evaluate(el => { el.scrollTop = 120; el.dispatchEvent(new Event('scroll')); });
    await expect(scroller).toHaveAttribute('data-stuck', /.*/);
    expect(await line()).not.toBe(rest);
    // Stripes are a faint tint, not the header color.
    const stripe = await page.locator('tbody tr').nth(1).evaluate(el => getComputedStyle(el).backgroundColor);
    const head = await page.locator('thead').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(stripe).not.toBe(head);
  });
}
