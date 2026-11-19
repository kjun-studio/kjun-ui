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
    // Without a description the avatar (ListRow's 32px sm square) and the switch reach into the padding like ListRow, so rows keep 56.
    expect((await box(page.getByTestId('row-avatar'))).height).toBeCloseTo(2 * list.minimumHeight, 0);
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
    // A paragraph takes its role's line boxes: three caption lines.
    expect((await box(page.getByTestId('text-caption'))).height).toBeCloseTo(3 * type.caption.lineHeightPx, 0);
    // Counts from data are bounded: Infinity draws no rows instead of throwing, 1e9 columns stop at 100.
    expect((await box(page.getByTestId('table-unbounded'))).height).toBeGreaterThan(0);
    // Form action bars: end-aligned, the size's button height, the primary last.
    const sk = tokens.extensions.skeleton, form = await box(page.getByTestId('form-actions'));
    const bars = await page.getByTestId('form-actions').evaluate((el, h) => [...el.querySelectorAll('*')].map(n => n.getBoundingClientRect())
      .filter(r => Math.abs(r.height - h) < 0.6 && r.width < 120).map(r => ({ left: r.left, right: r.right, width: r.width }))
      .filter((r, i, all) => all.findIndex(o => Math.abs(o.left - r.left) < 0.6 && Math.abs(o.width - r.width) < 0.6) === i), tokens.button.heights.md);
    expect(bars.map(b => Math.round(b.width))).toEqual([sk.actionWidth, sk.primaryActionWidth]);
    expect(bars[1].right).toBeCloseTo(form.x + form.width, 0);
    expect(bars[1].left - bars[0].right).toBeCloseTo(tokens.modal.actionsGap, 0);
    // The market table skeleton announces its loading text and keeps the table silent.
    const marketStatus = page.getByTestId('market-status').getByRole('status');
    await expect(marketStatus).toHaveCount(1);
    if (platform === 'native') await expect(marketStatus).toHaveAttribute('aria-label', '표를 불러오는 중');
    else await expect(marketStatus).toContainText('표를 불러오는 중');
    // A stat in a wide box stops its bars at a KPI's usual size: label, value, description.
    const statBars = await page.getByTestId('stat').evaluate(el => [...el.querySelectorAll('*')].map(n => n.getBoundingClientRect())
      .filter(r => r.height > 0 && r.height < 30 && r.width > 20 && r.width < 300).map(r => Math.round(r.width)));
    expect(Math.max(...statBars)).toBe(sk.statValueMaxWidth);
    for (const w of [sk.statLabelMaxWidth, sk.statDescriptionMaxWidth]) expect(statBars).toContain(w);
    // A root style reaches the outer element.
    const styled = await box(page.getByTestId('styled')), styledBar = await page.getByTestId('styled').evaluate(el => el.firstElementChild!.getBoundingClientRect().top - el.getBoundingClientRect().top);
    expect(styledBar).toBeCloseTo(12, 0);
    expect(styled.height).toBeCloseTo(32, 0);
  });
}
