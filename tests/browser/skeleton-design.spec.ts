import { expect, test } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';

const box = async (locator: any) => (await locator.boundingBox())!;
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: skeleton lines, list rows, loading text and table cards`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 1000 });
    await openFixture(page, platform, '', 'skeleton-design');
    const type = tokens.typography, list = tokens.extensions.list;
    // A caption line is the caption line box with a bar half as tall.
    expect((await box(page.getByTestId('line-caption'))).height).toBeCloseTo(type.caption.lineHeightPx, 0);
    // Row variant: KjunListRow height with title and description, and a divider that starts at the text.
    const row = page.getByTestId('row');
    expect((await box(row)).height).toBeCloseTo(2 * (list.padding * 2 + type.control.lineHeightPx + list.descriptionGap + type.caption.lineHeightPx), 0);
    const dividerStart = (testId: string) => page.getByTestId(testId).evaluate(el => {
      const root = el.getBoundingClientRect();
      for (const node of el.querySelectorAll('*')) {
        const after = getComputedStyle(node, '::after');
        if (after.content !== 'none' && after.content !== 'normal' && after.height === '1px') return node.getBoundingClientRect().left - root.left + parseFloat(after.left);
        const own = node.getBoundingClientRect();
        if (own.height === 1 && own.width < root.width) return own.left - root.left;
      }
      return -1;
    });
    expect(await dividerStart('row')).toBeCloseTo(list.padding, 0);
    expect(await dividerStart('row-avatar')).toBeCloseTo(list.padding + list.leadingWidth + list.gap, 0);
    // Without a description the avatar sets the row height; a switch ends it.
    expect((await box(page.getByTestId('row-avatar'))).height).toBeCloseTo(2 * (list.padding * 2 + tokens.extensions.skeleton.listAvatarSize), 0);
    const sw = tokens.extensions.switch;
    expect(await page.getByTestId('row-avatar').evaluate((el, s) => [...el.querySelectorAll('*')].some(n => {
      const r = n.getBoundingClientRect(); return Math.abs(r.width - s.w) < 0.6 && Math.abs(r.height - s.h) < 0.6;
    }), { w: sw.widths.md, h: sw.heights.md })).toBe(true);
    // Loading text is announced as a status and not shown.
    await expect(page.getByTestId('status').getByRole('status')).toHaveCount(1);
    if (platform === 'native') await expect(page.getByTestId('status').getByRole('status')).toHaveAttribute('aria-label', '목록을 불러오는 중');
    else await expect(page.getByTestId('status').getByRole('status')).toContainText('목록을 불러오는 중');
    await expect(page.getByTestId('row').getByRole('status')).toHaveCount(0);
    // Table cards load as one card each, never a card skeleton inside the card.
    if (platform !== 'native') await expect(page.getByTestId('table-cards').locator('.kjun-table-card .kjun-skeleton-card')).toHaveCount(0);
    const titleBar = await page.getByTestId('table-cards').evaluate((el, w) => [...el.querySelectorAll('*')].some(n => {
      const r = n.getBoundingClientRect(); return Math.abs(r.width - w) < 0.6 && r.height > 0 && r.height < 20;
    }), tokens.extensions.tableCard.titleSkeletonWidth);
    expect(titleBar).toBe(true);
  });
}
