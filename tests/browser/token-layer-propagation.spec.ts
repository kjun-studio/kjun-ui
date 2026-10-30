import { captureReview } from './review-captures';
import { test, expect } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { px, typography, displacement } from './token-propagation-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed independent layer roles reach modal widths, headings, drawer and tooltip`, async ({ page }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'token-connections');
    const trigger = page.getByRole('button', { name: '도움말 연결', exact: true });
    await page.mouse.move(1, 1); await page.mouse.move(4, 4);
    await trigger.hover();
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible();
    const tooltipBox = platform === 'native' ? page.getByText('연결 도움말', { exact: true }).locator('..') : tooltip;
    await expect(tooltipBox).toHaveCSS('padding-left', px(tokens.extensions.tooltip.paddingX));
    await expect(tooltipBox).toHaveCSS('padding-top', px(tokens.extensions.tooltip.paddingY));
    await captureReview(tooltip, { path: info.outputPath('tooltip-role.png') });
    await page.mouse.move(1400, 0);
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      await page.getByRole('button', { name: '창 ' + size, exact: true }).click();
      const dialog = page.getByRole('dialog', { name: '연결 창 제목', exact: true });
      const surface = platform === 'react' || platform === 'vue3' ? dialog.locator('..') : dialog;
      await expect(surface).toHaveCSS('width', px(tokens.modal.widths[size]));
      const heading = page.getByText('연결 창 제목', { exact: true });
      await expect(heading).toHaveCSS('font-size', px(tokens.modal.titleSize));
      await expect(heading).toHaveCSS('line-height', px(tokens.modal.titleLineHeight));
      await expect(heading).toHaveCSS('font-weight', String(tokens.modal.titleWeight));
      expect(parseFloat(await heading.evaluate(el => getComputedStyle(el).letterSpacing)) || 0).toBeCloseTo(tokens.modal.titleSize * tokens.typography.sectionTitle.letterSpacingEm, 2);
      if (size === 'md') await captureReview(surface, { path: info.outputPath('modal-role.png') });
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    }
    await page.getByRole('button', { name: '연결 패널 열기', exact: true }).click();
    const drawer = page.getByRole('dialog').filter({ hasText: '연결 패널' });
    await expect(drawer.getByRole('button', { name: '닫기', exact: true })).toHaveCSS('border-radius', px(tokens.extensions.drawer.closeRadius));
    await page.keyboard.press('Escape'); await expect(drawer).toHaveCount(0);
    await page.getByRole('button', { name: '메뉴 연결', exact: true }).click();
    const menuItem = page.getByRole('menuitem', { name: '연결 메뉴 항목', exact: true });
    await expect.poll(() => menuItem.evaluate(el => {
      for (let node = el.parentElement; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (parseFloat(style.borderTopWidth) > 0) return style.borderRadius;
      }
      return null;
    })).toBe(px(tokens.extensions.menu.radius));
    await page.keyboard.press('Escape'); await expect(menuItem).toHaveCount(0);
  });

  test(`${platform}: packed modal threshold and aliased menu typography survive resizing`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '?scenario=layers', 'motion');
    const panel = page.locator('.kjun-modal, .kjun-modal-container, [role="dialog"][aria-label="Motion modal"]');
    await page.getByRole('button', { name: 'Open modal', exact: true }).click();
    for (const delta of [-1, 0, 1]) {
      const width = tokens.responsive.modal + delta;
      await page.setViewportSize({ width, height: 1000 });
      const available = width - 2 * tokens.modal.mobileInset;
      await expect.poll(async () => (await panel.boundingBox())!.width)
        .toBeCloseTo(delta <= 0 ? available : Math.min(tokens.modal.widths.md, available), 0);
    }
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const label = page.getByText('Menu choice', { exact: true });
    await typography(label, tokens.typography.body);
    if (platform !== 'native') {
      await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; });
      await typography(label, tokens.typography.body, 1.25);
    }
    await label.click();
    await expect(label).toHaveCount(0);
  });

  test(`${platform}: packed modal popup and toast displacements follow motion roles`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await openFixture(page, platform, '?scenario=layers', 'motion');
    const modal = '.kjun-modal, .kjun-modal-container, [role="dialog"][aria-label="Motion modal"]';
    const toast = platform === 'native' ? '[data-testid^="toast-slot-"] > *' : '[data-toast-id] > *';
    const cases: [string, string, number, number][] = [
      [modal, 'modal-enter', tokens.motionDistance.modalEnter, tokens.motion.layerEnter],
      [modal, 'modal-exit', tokens.motionDistance.modalExit, tokens.motion.layerExit],
      ['.kjun-floating, [role="menu"], [aria-label="메뉴"]', 'popup', tokens.motionDistance.popup, tokens.motion.popupEnter],
      [toast, 'toast', tokens.motionDistance.toast, tokens.motion.toastEnter],
    ];
    for (const [selector, action, distance, duration] of cases) {
      const { samples, endpoints } = await displacement(page, selector, action, duration);
      expect(samples.length, action).toBeGreaterThan(2);
      expect(Math.max(...samples, ...endpoints), action).toBeGreaterThan(distance * 0.5);
      expect(Math.max(...samples, ...endpoints), action).toBeLessThanOrEqual(distance + 0.1);
      if (action === 'modal-exit') await expect(page.locator(modal)).toHaveCount(0);
      else await expect.poll(() => page.locator(selector).first().evaluate(element => {
        const style = getComputedStyle(element), matrix = new DOMMatrixReadOnly(style.transform);
        const offset = style.translate === 'none' ? [0, 0] : style.translate.split(' ').map(parseFloat);
        return Math.max(Math.abs(matrix.m41 + (offset[0] || 0)), Math.abs(matrix.m42 + (offset[1] || 0)));
      }), { message: action + ' settles at its final position' }).toBeCloseTo(0, 1);
      if (action === 'popup') await page.keyboard.press('Escape');
    }
  });
}
