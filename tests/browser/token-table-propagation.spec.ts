import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px, typography } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed table spacing and control motion follow token changes`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '', 'token-application');
    for (const density of ['regular','compact'] as const) {
      const region = page.getByTestId(density);
      const cell = platform === 'native' ? region.getByText('문서', { exact: true }).locator('..') : region.locator('tbody td').first();
      const header = platform === 'native' ? region.getByText('이름', { exact: true }).locator('..') : region.locator('thead th').first();
      await expect(cell).toHaveCSS('padding-left', tokens.table.cellPadding[density].x + 'px');
      await expect(cell).toHaveCSS('padding-top', tokens.table.cellPadding[density].y + 'px');
      await expect(header).toHaveCSS('padding-left', tokens.table.headerPadding.x + 'px');
      await expect(header).toHaveCSS('padding-top', tokens.table.headerPadding.y + 'px');
    }
    if (platform !== 'native') {
      const duration = tokens.motion.control / 1000 + 's';
      await expect(page.getByTestId('button').getByRole('button')).toHaveCSS('transition-duration', duration + ', ' + duration);
      const input = page.getByTestId('input').getByRole('textbox');
      await expect(input).toHaveCSS('transition-duration', duration + ', ' + duration);
    }
  });

  test(`${platform}: packed independent table, pagination and state roles remain usable`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    const table = page.getByTestId('table');
    const dimensions = await table.evaluate(el => [...el.querySelectorAll('*')].map(node => ({ w: getComputedStyle(node).width, h: getComputedStyle(node).height })));
    expect(dimensions.some(value => value.w === px(tokens.table.actionColumnWidth) && value.h === px(tokens.table.skeletonHeight))).toBe(true);
    const next = page.getByTestId('pagination').getByRole('button', { name: '다음 페이지', exact: true });
    const size = platform === 'native' ? Math.max(tokens.extensions.pagination.itemSize, tokens.native.minimumTouchTarget) : tokens.extensions.pagination.itemSize;
    await expect(next).toHaveCSS('width', px(size));
    await expect(next).toHaveCSS('border-radius', px(tokens.extensions.pagination.radius));
    await next.click(); await expect(page.getByTestId('events')).toHaveText('0/2');
    // A blocking error is an md KjunAlert; its message takes the alert body type like any other alert.
    await expect(page.getByText('연결 오류 메시지', { exact: true })).toHaveCSS('font-size', px(tokens.typography.body.fontSizePx));
    await page.setViewportSize({ width: 320, height: 1000 });
    const segments = page.getByTestId('segments');
    if (platform === 'native') {
      const separator = segments.getByText('·', { exact: true });
      await expect(separator).toHaveCSS('margin-left', px(tokens.extensions.kpiRow.separatorGap));
      await expect(separator).toHaveCSS('margin-right', px(tokens.extensions.kpiRow.separatorGap));
      await expect(segments.getByText('/', { exact: true })).not.toBeVisible();
      await expect(segments.getByText('첫 조각', { exact: true })).toHaveCSS('margin-right', px(tokens.dimension.value4));
    } else {
      const labeled = segments.locator(platform === 'react' ? '.kjun-kpi-row__segment--labeled' : '.kjun-kpi-row__segment--labeled').last();
      expect(await labeled.evaluate(el => getComputedStyle(el, '::before').marginLeft)).toBe(px(tokens.extensions.kpiRow.separatorGap));
    }
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await captureReview(segments, { path: info.outputPath('kpi-role.png') });
  });
}
