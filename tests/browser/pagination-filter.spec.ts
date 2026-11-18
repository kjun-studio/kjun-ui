import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureCases(options), options);
const fill = (locator: ReturnType<Page['locator']>) => locator.evaluate(e => getComputedStyle(e).backgroundColor);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: Pagination keeps one length, marks and keeps the current page, formats the range, follows layout and disabled`, async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 600 });
    await openFixture(page, platform, '', 'pagination-filter');
    const nav = page.getByTestId('pagination').getByRole('navigation', { name: '페이지 탐색' });
    await expect(nav).toBeVisible();
    const previous = nav.getByRole('button', { name: '이전 페이지' }).last(), next = nav.getByRole('button', { name: '다음 페이지' }).last();
    // The list keeps one length on every page, so the arrows never move.
    const x = (await previous.boundingBox())!.x;
    for (const target of [2, 3, 4, 5, 6, 996, 999, 1000]) {
      await update(page, { page: target });
      await expect(nav.getByRole('button', { name: `${target} 페이지` })).toHaveAttribute('aria-current', 'page');
      expect(Math.round((await previous.boundingBox())!.x)).toBe(Math.round(x));
    }
    // A gap of one page shows that page, never "1 … 3".
    await update(page, { page: 4 });
    for (const n of [1, 2, 3, 4, 5, 1000]) await expect(nav.getByRole('button', { name: `${n} 페이지` })).toBeVisible();
    // The current page keeps its brand fill under the pointer (Native Web's primary button darkens to brand-hover instead).
    const current = nav.getByRole('button', { name: '4 페이지' });
    if (platform !== 'native') {
      const before = await fill(current);
      await current.hover();
      await expect.poll(() => fill(current)).toBe(before);
      await page.mouse.move(0, 0);
    }
    // The formatter reaches every number in the range line.
    await update(page, { page: 51 });
    await expect(nav).toContainText('1,001 - 1,020 / 19,990개');
    // disabled locks every move; the current page stays filled.
    await update(page, { disabled: true });
    await expect(next).toBeDisabled();
    await expect(nav.getByRole('button', { name: '52 페이지' })).toBeDisabled();
    await expect(nav.getByRole('button', { name: '51 페이지' })).toHaveAttribute('aria-current', 'page');
    await update(page, { disabled: false });
    await next.click();
    await expect(page.getByTestId('log')).toHaveText('52');
    // Page size is a quiet 32px text button at the range line's 14px type, naming its size and opening menu radio items.
    const size = nav.getByRole('button', { name: '페이지당 항목 수, 20개씩', exact: true });
    expect(Math.round((await size.boundingBox())!.height)).toBe(tokens.extensions.pagination.itemSize);
    await size.click();
    await page.getByRole('menuitemradio', { name: '50개씩', exact: true }).click();
    await expect(nav.getByRole('button', { name: '페이지당 항목 수, 50개씩', exact: true })).toBeVisible();
    await expect(page.getByTestId('log')).toHaveText('52,1');
    // No top line: an in-flow component separates by space, not a hairline.
    await expect(nav).toHaveCSS('border-top-width', '0px');
    // compact keeps the short form on a wide window; full keeps the numbered list.
    await update(page, { layout: 'compact' });
    await expect(nav.getByRole('button', { name: '52 페이지' })).toHaveCount(0);
    await update(page, { page: 52 });
    await expect(nav).toContainText('52 / 1000');
    await update(page, { layout: 'full' });
    await expect(nav.getByRole('button', { name: '52 페이지' })).toBeVisible();
  });

  test(`${platform}: FilterGroup is a named group, names counted chips and fades its scrolling row`, async ({ page }) => {
    await openFixture(page, platform, '', 'pagination-filter');
    const group = page.getByTestId('filters').getByRole('group', { name: '상태 필터' });
    await expect(group).toBeVisible();
    const done = group.getByRole('button', { name: '완료, 29개' });
    await expect(done).toHaveAttribute('aria-pressed', 'true');
    // The selected chip starts in view, clear of the fade, on a row that scrolls past its 240px box.
    const box = (await page.getByTestId('filters').boundingBox())!, chip = (await done.boundingBox())!;
    expect(chip.x).toBeGreaterThanOrEqual(box.x + tokens.extensions.scrollFade.width - 1);
    expect(chip.x + chip.width).toBeLessThanOrEqual(box.x + box.width - tokens.extensions.scrollFade.width + 1);
    if (platform !== 'native') {
      const row = page.locator('.kjun-filter-group');
      await expect(row).toHaveAttribute('data-fade-start', '');
      await expect(row).toHaveAttribute('data-fade-end', '');
      // The count follows the label, outside its reserved width.
      await expect(done.locator('.kjun-filter-count')).toHaveText('29');
    }
    // Choosing the last chip keeps it pressed; the row ends there, so only its start fades.
    await group.getByRole('button', { name: '공유됨, 3개' }).click();
    await expect(group.getByRole('button', { name: '공유됨, 3개' })).toHaveAttribute('aria-pressed', 'true');
    if (platform !== 'native') await expect(page.locator('.kjun-filter-group')).not.toHaveAttribute('data-fade-end', '');
    // A value set from outside scrolls that chip in clear of the start fade.
    await update(page, { filter: 'doing' });
    await expect.poll(async () => Math.round((await group.getByRole('button', { name: '진행 중, 12개' }).boundingBox())!.x - box.x))
      .toBeGreaterThanOrEqual(tokens.extensions.scrollFade.width - 1);
  });
}
