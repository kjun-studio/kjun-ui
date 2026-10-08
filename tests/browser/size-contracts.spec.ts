import { test, expect, type Locator } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
const px = (value: number) => `${value}px`;
const e = tokens.extensions;
async function dimensions(box: Locator, width: number | undefined, height: number) {
  await expect.poll(() => box.evaluate((el, values) => [el, ...el.querySelectorAll('*')].some(node => {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (values.width == null || Math.abs(parseFloat(style.width) - values.width) < 0.1) && Math.abs(parseFloat(style.height) - values.height) < 0.1;
  }), { width, height })).toBe(true);
}
async function cappedScroll(child: Locator, maximum: number) {
  await expect.poll(() => child.evaluate((el, limit) => {
    for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
      const css = getComputedStyle(node);
      if (/auto|scroll/.test(css.overflowY) && node.scrollHeight > node.clientHeight && node.clientHeight <= limit + 1) return true;
    }
    return false;
  }, maximum)).toBe(true);
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: packed size roles drive Spinner, Progress, icons and selection`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'size-contracts');
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      await expect(page.getByTestId('spinner-' + size).locator('svg')).toHaveCSS('width', px(e.spinner.sizes[size]));
      await expect(page.getByTestId('spinner-' + size).locator('svg')).toHaveCSS('height', px(e.spinner.sizes[size]));
    }
    for (const size of ['sm', 'md', 'lg'] as const) await dimensions(page.getByTestId('progress-' + size), undefined, e.progress.heights[size]);
    await page.getByRole('button', { name: '진행 변경', exact: true }).click();
    await expect(page.getByTestId('events')).toHaveText('75/false/a');
    for (const [id, size] of [['image', e.image.fallbackIconSize], ['avatar-fallback', e.avatar.fallbackIconSize], ['form-error', e.form.messageIconSize]] as const)
      await expect(page.getByTestId(id).locator('svg').first()).toHaveCSS('width', px(size));
    const chip = page.getByTestId('chip');
    await expect(chip.locator('svg').first()).toHaveCSS('width', px(e.chip.iconSizes.md));
    await expect(chip.locator('svg').last()).toHaveCSS('width', px(e.chip.removeIconSizes.md));
    await chip.getByRole('button').click();
    await expect(page.getByTestId('events')).toHaveText('75/true/a');
    const breadcrumb = page.getByTestId('breadcrumb');
    await expect(breadcrumb.locator('svg').first()).toHaveCSS('width', px(e.breadcrumb.iconSize));
    await expect(breadcrumb.locator('svg').last()).toHaveCSS('width', px(e.breadcrumb.separatorSize));
    await expect(page.getByTestId('alert').locator('svg').first()).toHaveCSS('width', px(e.alert.iconSizes.md));
    await expect(page.getByTestId('alert').locator('svg').last()).toHaveCSS('width', px(e.alert.closeIconSize));
    await dimensions(page.getByTestId('selection'), e.selection.dotSize, e.selection.dotSize);
    await page.getByTestId('selection').getByRole('button', { name: '선택 B', exact: true }).click();
    await expect(page.getByTestId('events')).toHaveText('75/true/b');
    await page.getByTestId('selection').screenshot({ path: info.outputPath('size-selection.png') });
  });

  test(`${platform}: packed size roles drive base, list, form and chart skeletons`, async ({ page }, info) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'size-contracts');
    await dimensions(page.getByTestId('skeleton-text'), undefined, e.skeleton.lineHeights.md);
    await dimensions(page.getByTestId('skeleton-avatar'), e.skeleton.avatarSize, e.skeleton.avatarSize);
    await dimensions(page.getByTestId('skeleton-card'), e.skeleton.cardAvatarSize, e.skeleton.cardAvatarSize);
    await dimensions(page.getByTestId('skeleton-card'), undefined, e.skeleton.lineHeights.sm);
    await dimensions(page.getByTestId('skeleton-table'), undefined, e.skeleton.tableLineHeight);
    await dimensions(page.getByTestId('skeleton-chart'), undefined, e.skeleton.chartHeight);
    await dimensions(page.getByTestId('skeleton-chart'), undefined, e.skeleton.chartAxisHeight);
    await dimensions(page.getByTestId('skeleton-stat'), e.skeleton.statWidth, e.skeleton.statHeight);
    await dimensions(page.getByTestId('skeleton-block'), undefined, e.skeleton.blockHeight);
    await dimensions(page.getByTestId('list-skeleton'), e.skeleton.listAvatarSize, e.skeleton.listAvatarSize);
    await dimensions(page.getByTestId('list-skeleton'), e.skeleton.quoteWidth, e.skeleton.quoteHeight);
    await dimensions(page.getByTestId('list-skeleton'), e.skeleton.detailWidth, e.skeleton.lineHeights.sm);
    await dimensions(page.getByTestId('form-skeleton'), e.skeleton.formLabelWidth, e.skeleton.formLabelHeight);
    await dimensions(page.getByTestId('form-skeleton'), undefined, tokens.input.md.lineHeight * 3 + tokens.input.md.textareaPaddingY * 2 + 2 * tokens.border.controlWidth);
    await dimensions(page.getByTestId('chart-skeleton'), undefined, e.chartSkeleton.height);
    await dimensions(page.getByTestId('chart-skeleton'), e.chartSkeleton.donutLabelWidth, e.chartSkeleton.donutLabelHeight);
    await page.getByTestId('chart-skeleton').screenshot({ path: info.outputPath('size-chart.png') });
  });

  test(`${platform}: packed size roles drive financial indicators`, async ({ page }) => {
    await openFixture(page, platform, '', 'size-contracts');
    await dimensions(page.getByTestId('price'), e.financial.priceSkeletonWidth, e.financial.priceSkeletonHeight);
    if (platform === 'native') await dimensions(page.getByTestId('signed'), e.financial.signedSkeletonWidth, e.financial.signedSkeletonHeight);
    else await expect.poll(() => page.getByTestId('signed').evaluate((el, width) => [...el.querySelectorAll('*')].some(node => getComputedStyle(node).width === width + 'px'), e.financial.signedSkeletonWidth)).toBe(true);
    await expect(page.getByTestId('sparkline').locator('svg')).toHaveCSS('width', px(e.financial.sparklineWidth));
    await expect(page.getByTestId('sparkline').locator('svg')).toHaveCSS('height', px(e.financial.sparklineHeight));
    await dimensions(page.getByTestId('progress-cell'), undefined, e.financial.progressHeight);
  });

  test(`${platform}: packed size roles drive market and KPI placeholders`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openFixture(page, platform, '', 'size-contracts');
    await dimensions(page.getByTestId('market-card'), e.financial.priceSkeletonWidth, e.financial.priceSkeletonHeight);
    const market = page.getByTestId('market-skeleton');
    await dimensions(market, e.financial.priceSkeletonWidth, e.financial.priceSkeletonHeight);
    await dimensions(market, e.marketTable.actionSkeletonWidth, e.marketTable.headerSkeletonHeight);
    await dimensions(market, e.marketTable.actionSkeletonWidth, e.financial.priceSkeletonHeight);
    await dimensions(page.getByTestId('kpi-row'), e.kpiRow.labelSkeletonWidth, e.kpiRow.labelSkeletonHeight);
    await dimensions(page.getByTestId('kpi-dot'), e.kpiRow.dotSize, e.kpiRow.dotSize);
    if (platform === 'native') {
      const hero = page.getByTestId('kpi-hero');
      // Placeholders keep their line's height so the loaded hero does not move.
      await dimensions(hero, e.kpiHero.deltaSkeletonWidth, tokens.typography.numberMd.lineHeightPx);
      await dimensions(hero, e.kpiHero.secondarySkeletonWidth, tokens.typography.numberMd.lineHeightPx);
      await dimensions(hero, e.kpiHero.descriptionSkeletonWidth, tokens.typography.caption.lineHeightPx);
    }
  });

  test(`${platform}: packed size roles drive floating panels and close controls`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'size-contracts');
    await page.getByRole('button', { name: '기본 패널 열기', exact: true }).click();
    const drawer = page.getByRole('dialog').filter({ hasText: '기본 크기 패널' });
    const drawerPanel = platform === 'native' ? page.getByText('기본 크기 패널', { exact: true }).locator('../..') : platform === 'react' ? drawer.locator('..') : drawer;
    await expect(drawerPanel).toHaveCSS('width', px(e.drawer.width));
    await expect(drawer.getByRole('button', { name: '닫기', exact: true }).locator('svg')).toHaveCSS('width', px(e.drawer.closeIconSize));
    await drawer.getByRole('button', { name: '닫기', exact: true }).click();
    await expect(drawer).toHaveCount(0);
    await page.getByRole('button', { name: '닫기 크기 확인', exact: true }).click();
    const close = page.getByRole('dialog').getByRole('button', { name: '닫기', exact: true });
    await expect(close.locator('svg')).toHaveCSS('width', px(tokens.modal.closeIconSize));
    if (platform !== 'native') await expect(close).toHaveCSS('width', px(tokens.modal.closeSize));
    await close.click(); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: '크기 메뉴', exact: true }).click();
    const menuItem = page.getByRole('menuitem', { name: '항목 0', exact: true });
    await expect(menuItem.locator('svg')).toHaveCSS('width', px(e.menu.iconSize));
    await cappedScroll(menuItem, e.floating.maxHeight);
    await page.keyboard.press('Escape'); await expect(page.getByRole('menuitem')).toHaveCount(0);
    await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '크기 선택', exact: true }).click();
    const option = page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '선택 항목 1', exact: true });
    await cappedScroll(option, e.menu.listMaxHeight);
    await option.click();
    await expect(page.getByTestId('events')).toHaveText('25/false/1');
    await page.getByRole('button', { name: '크기 도움말 열기', exact: true }).hover();
    const tooltip = page.getByRole('tooltip'); await expect(tooltip).toBeVisible();
    if (platform === 'react') await expect(tooltip.locator('svg')).toHaveCSS('width', px(e.tooltip.arrowSize));
    const textBox = platform === 'native' ? page.getByText('크기 도움말', { exact: true }).locator('..') : tooltip;
    await expect(textBox).toHaveCSS('max-width', px(e.tooltip.maxWidth));
  });
}
