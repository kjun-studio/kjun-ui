import { captureReview } from './review-captures';
import { test, expect, type Locator } from '@playwright/test';
import { tokens, type TypographyToken } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { toasts } from './toast-locators';

const px = (value: number) => value + 'px';
async function typography(node: Locator, spec: TypographyToken, scale: number) {
  await expect(node).toHaveCSS('font-size', px(spec.fontSizePx * scale));
  await expect(node).toHaveCSS('line-height', px(spec.lineHeightPx * scale));
  await expect(node).toHaveCSS('font-weight', String(spec.fontWeight));
  const tracking = await node.evaluate(el => getComputedStyle(el).letterSpacing);
  expect(tracking === 'normal' ? 0 : parseFloat(tracking)).toBeCloseTo(spec.fontSizePx * spec.letterSpacingEm * scale, 2);
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: packed Chip typography and removal dimensions share their roles`, async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'chip-toast-tokens');
    const chip = tokens.extensions.chip;
    for (const scale of platform === 'native' ? [1] : [1, 1.25]) {
      await page.evaluate(scale => { document.documentElement.style.fontSize = scale * 16 + 'px'; }, scale);
      for (const size of ['sm', 'md', 'lg'] as const) {
        const box = page.getByTestId(`chip-${size}`);
        await typography(box.getByText(`칩 ${size}`, { exact: true }), chip.typography[size], scale);
        const remove = box.getByRole('button', { name: `삭제 ${size}`, exact: true });
        const dimension = platform === 'native' ? chip.nativeRemoveSize : chip.removeSize;
        await expect(remove).toHaveCSS(platform === 'native' ? 'width' : 'min-width', px(dimension));
        await expect(remove).toHaveCSS(platform === 'native' ? 'height' : 'min-height', px(dimension));
        if (scale === 1) {
          await expect(remove.locator('svg')).toHaveCSS('width', px(chip.removeIconSizes[size]));
          // The Web removal target overlaps the chip padding instead of stretching sm to md height.
          if (platform !== 'native') expect((await remove.locator('..').boundingBox())!.height)
            .toBe(Math.max(chip[size], chip.typography[size].lineHeightPx + 2 * chip.paddingY, chip.removeSize));
        }
      }
    }
    await page.evaluate(() => { document.documentElement.style.fontSize = '16px'; });
    const disabled = page.getByRole('button', { name: '비활성 삭제', exact: true });
    await expect(disabled).toBeDisabled();
    // Send an actual pointer click while bypassing Playwright's disabled wait.
    await disabled.click({ force: true });
    await expect(page.getByTestId('actions')).toHaveText('0');
    await page.setViewportSize({ width: 320, height: 800 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await captureReview(page, { path: testInfo.outputPath('chip-roles.png') });
    for (const size of ['sm', 'md', 'lg'] as const) {
      const remove = page.getByRole('button', { name: `삭제 ${size}`, exact: true });
      if (size === 'md') { await remove.focus(); await page.keyboard.press('Enter'); }
      else await remove.click();
      await expect(page.getByTestId(`chip-${size}`).locator(':scope > *')).toHaveCount(0);
    }
    await expect(page.getByTestId('removed')).toHaveText('sm,md,lg');
  });

  test(`${platform}: packed Toast dimensions preserve actions and narrow layouts`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'chip-toast-tokens');
    await page.getByRole('button', { name: '알림 열기', exact: true }).click();
    const spec = tokens.extensions.toast;
    const toast = toasts(page).filter({ hasText: '토큰 알림' });
    // Only danger interrupts: an info toast is a polite status.
    await expect(page.getByRole('status').filter({ hasText: '토큰 알림' })).toHaveCount(1);
    const widthOwner = platform === 'native' ? toast.locator('..') : toast;
    await expect(widthOwner).toHaveCSS('max-width', px(spec.maxWidth));
    if (platform !== 'native') await expect(toast).toHaveCSS('min-width', px(spec.minWidth));
    // No countdown is drawn; the icon, the heading and the close button share the first line's centre.
    if (platform !== 'native') await expect(toast.locator('.kjun-toast-progress')).toHaveCount(0);
    const close = toast.getByRole('button', { name: '알림 닫기', exact: true });
    const icon = toast.locator('svg').first(), heading = toast.getByText('토큰 알림', { exact: true });
    await expect(icon).toHaveCSS('width', px(spec.iconSize));
    await expect(close.locator('svg')).toHaveCSS('width', px(spec.closeIconSize));
    const middle = async (node: Locator) => { const box = (await node.boundingBox())!; return box.y + box.height / 2; };
    expect(Math.abs(await middle(icon) - await middle(heading))).toBeLessThanOrEqual(1);
    expect(Math.abs(await middle(close) - await middle(heading))).toBeLessThanOrEqual(1);
    const closeSize = platform === 'native' ? Math.max(spec.closeSize, tokens.native.minimumTouchTarget) : spec.closeSize;
    await expect(close).toHaveCSS(platform === 'native' ? 'min-width' : 'width', px(closeSize));
    await expect(close).toHaveCSS(platform === 'native' ? 'min-height' : 'height', px(closeSize));
    await captureReview(toast, { path: testInfo.outputPath('toast-roles.png') });
    await page.setViewportSize({ width: 320, height: 1100 });
    await expect.poll(async () => {
      const box = (await toast.boundingBox())!;
      return box.x >= 0 && box.x + box.width <= 320;
    }).toBe(true);
    await toast.getByRole('button', { name: '알림 실행', exact: true }).click();
    await expect(page.getByTestId('actions')).toHaveText('1');
    await expect(toast).toHaveCount(0);
    await page.getByRole('button', { name: '알림 열기', exact: true }).click();
    await close.focus(); await page.keyboard.press('Enter');
    await expect(toast).toHaveCount(0);
  });

  test(`${platform}: a compact toast is a content-wide capsule and an error stays until closed`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'chip-toast-tokens');
    const spec = tokens.extensions.toast;
    await page.getByRole('button', { name: '짧은 알림 열기', exact: true }).click();
    const compact = page.getByRole('status').filter({ hasText: '짧은 알림' });
    await expect(compact).toBeVisible();
    await expect(compact.getByRole('button')).toHaveCount(0);
    const box = (await compact.boundingBox())!;
    expect(box.height).toBe(spec.compact.height);
    expect(box.width).toBeLessThan(spec.minWidth);
    await page.getByRole('button', { name: '오류 알림 열기', exact: true }).click();
    const error = page.getByRole('alert').filter({ hasText: '남는 오류' });
    await expect(error).toBeVisible();
    // Errors default to staying: well past the old five seconds the toast is still there.
    await page.waitForTimeout(5600);
    await expect(error).toBeVisible();
    await error.getByRole('button', { name: '알림 닫기', exact: true }).click();
    await expect(error).toHaveCount(0);
  });

  test(`${platform}: focus returns from a leaving toast, and a sideways swipe closes it`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'chip-toast-tokens');
    const opener = page.getByRole('button', { name: '오류 알림 열기', exact: true });
    await opener.focus();
    await page.keyboard.press('Enter');
    const error = page.getByRole('alert').filter({ hasText: '남는 오류' });
    const close = error.getByRole('button', { name: '알림 닫기', exact: true });
    await close.focus();
    await page.keyboard.press('Enter');
    await expect(error).toHaveCount(0);
    // Native Web has no focus handoff; the web packages return focus to the opener.
    if (platform !== 'native') await expect(opener).toBeFocused();
    if (platform === 'native') return;
    await opener.click();
    const card = toasts(page).filter({ hasText: '남는 오류' });
    const box = (await card.boundingBox())!, y = box.y + box.height / 2;
    const swipe = async (distance: number) => card.evaluate((node, { y, x, distance }) => {
      const fire = (type: string, clientX: number) => node.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 7, pointerType: 'touch', clientX, clientY: y }));
      fire('pointerdown', x);
      for (let step = 1; step <= 4; step++) fire('pointermove', x + distance * step / 4);
      fire('pointerup', x + distance);
    }, { y, x: box.x + 40, distance });
    // A short swipe springs back; one past the distance closes the toast.
    await swipe(tokens.extensions.toast.swipeDistance / 2);
    await expect(card).toHaveCount(1);
    await swipe(tokens.extensions.toast.swipeDistance + 8);
    await expect(card).toHaveCount(0);
  });
}
