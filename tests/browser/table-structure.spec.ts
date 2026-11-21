import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunTable structure: column groups over the header, a cell that spans the next column, and a pressable cell.
const table = (page: Page, id: string) => page.getByTestId(id);
const events = (page: Page) => page.getByTestId('events');

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';

    test.describe('wide', () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1200 });
        await openFixture(page, platform, '', 'table-structure');
      });

      test('a column group labels its columns from a second header row, and its columns still sort', async ({ page }) => {
        const group = table(page, 'grouped').getByText('실적', { exact: true }).first(), sales = table(page, 'grouped').getByText('매출', { exact: true });
        const top = (await group.boundingBox())!, below = (await sales.boundingBox())!, profit = (await table(page, 'grouped').getByText('영업이익', { exact: true }).boundingBox())!;
        // The group label sits above its columns, between the start of the first and the end of the last.
        expect(top.y + top.height).toBeLessThanOrEqual(below.y + 1);
        expect(top.x + top.width / 2).toBeLessThan(profit.x + profit.width);
        expect(top.x + top.width / 2).toBeGreaterThan(below.x - 200);
        if (web) {
          const head = table(page, 'grouped').locator('thead');
          await expect(head.locator('tr')).toHaveCount(2);
          await expect(head.locator('th[scope="colgroup"]')).toHaveAttribute('colspan', '2');
          await expect(head.locator('th', { hasText: '종목' })).toHaveAttribute('rowspan', '2');
          await head.getByRole('button', { name: '매출' }).click();
          await expect(head.locator('th', { hasText: '매출' })).toHaveAttribute('aria-sort', 'ascending');
        }
      });

      test('a spanning cell covers the next column, and the covered cell is not drawn', async ({ page }) => {
        await expect(table(page, 'grouped').getByText('실적 발표 전', { exact: true })).toBeVisible();
        // Row b has no values: without the span it would show "-" for profit as well as for its target.
        await expect(table(page, 'grouped').getByText('-', { exact: true })).toHaveCount(1);
        const merged = (await table(page, 'grouped').getByText('실적 발표 전', { exact: true }).boundingBox())!;
        const profitHeader = (await table(page, 'grouped').getByText('영업이익', { exact: true }).boundingBox())!;
        // Right-aligned across both columns: the text ends under the second column.
        expect(merged.x + merged.width).toBeGreaterThan(profitHeader.x);
        if (web) {
          const cell = table(page, 'grouped').locator('td', { hasText: '실적 발표 전' });
          await expect(cell).toHaveAttribute('colspan', '2');
          await expect(table(page, 'grouped').locator('tbody tr').nth(1).locator('td')).toHaveCount(3);
        }
      });

      test('a pressable cell runs its own action by click and keyboard, never the row\'s', async ({ page }) => {
        const button = table(page, 'grouped').getByRole('button', { name: '가나전자 목표가, 근거 보기', exact: true });
        await button.click();
        await expect(events(page)).toHaveText('cell:a');
        if (web) {
          await button.focus();
          await page.keyboard.press('Enter');
          await expect(events(page)).toHaveText('cell:a cell:a');
          const target = table(page, 'grouped').locator('[data-target-cell="a"]');
          await expect(target).toHaveAttribute('title', '가나전자 목표가');
          // The app's style joins KJUN's alignment instead of replacing it.
          await expect(target).toHaveCSS('font-style', 'italic');
          await expect(target).toHaveCSS('text-align', 'right');
        }
        await table(page, 'grouped').getByText('마바물산', { exact: true }).click();
        await expect(events(page)).toHaveText(web ? 'cell:a cell:a row:c' : 'cell:a row:c');
      });

      test('the loading skeleton and the selection column use the same two header rows', async ({ page }) => {
        await expect(table(page, 'loading').getByText('실적', { exact: true })).toBeVisible();
        if (!web) return;
        await expect(table(page, 'loading').locator('thead tr')).toHaveCount(2);
        await expect(table(page, 'loading').locator('tbody tr').first().locator('td')).toHaveCount(4);
        const select = table(page, 'selectable').locator('thead th').first();
        await expect(select).toHaveAttribute('rowspan', '2');
        await expect(table(page, 'selectable').locator('tbody tr').nth(1).locator('td')).toHaveCount(4);
      });
    });

    test('narrow cards use the column group as a section and leave a covered field out', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 1400 });
      await openFixture(page, platform, '', 'table-structure');
      const cards = table(page, 'grouped');
      // Cards draw no section names: the group names the fields' section for screen readers.
      if (web) await expect(cards.getByRole('group', { name: '실적' })).toHaveCount(3);
      // Rows a and c show both fields of the group; row b shows only the spanning one.
      await expect(cards.getByText('영업이익', { exact: true })).toHaveCount(2);
      await expect(cards.getByText('실적 발표 전', { exact: true })).toBeVisible();
      // The merged cell reads under the group's name, not the first column's.
      await expect(cards.getByText('매출', { exact: true })).toHaveCount(2);
      await expect(cards.getByText('실적', { exact: true })).toHaveCount(1);
      await cards.getByRole('button', { name: '마바물산 목표가, 근거 보기', exact: true }).click();
      await expect(events(page)).toHaveText('cell:c');
    });
  });
}
for (const platform of ['react', 'vue3']) {
  test(`${platform}: layout="fixed" keeps the given column widths, with or without grouped headers`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1200 });
    await openFixture(page, platform, '', 'table-structure');
    const width = (id: string, index: number) => table(page, id).locator('tbody tr').first().locator('td').nth(index).evaluate(el => Math.round(el.getBoundingClientRect().width));
    await expect(table(page, 'fixed').locator('table')).toHaveCSS('table-layout', 'fixed');
    await expect(table(page, 'auto').locator('table')).toHaveCSS('table-layout', 'auto');
    // The long name keeps its 160 instead of widening the column; the selectable table has its checkbox column first.
    for (const [id, start] of [['fixed', 0], ['fixed-grouped', 1]] as const) {
      expect(await width(id, start), id).toBe(160);
      expect(await width(id, start + 1), id).toBe(120);
    }
    expect(await width('auto', 0)).toBeGreaterThan(160);
    // The grouped table's first header row holds the group, so its widths come from the columns.
    await expect(table(page, 'fixed-grouped').locator('colgroup col')).toHaveCount(4);
  });
}
