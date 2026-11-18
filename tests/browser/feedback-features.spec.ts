import { test, expect, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { toasts } from './toast-locators';

const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureAlert(options), options);
const box = async (locator: Locator) => (await locator.boundingBox())!;
// The painted fill of a control: web paints the button, Native Web a square inside its larger touch target.
const fill = (locator: Locator) => locator.evaluate(el => [el, ...el.querySelectorAll('*')]
  .map(node => getComputedStyle(node).backgroundColor).find(color => !/rgba\(0, 0, 0, 0\)|transparent/.test(color)) ?? 'none');

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: Alert icon names, hides and keeps focus past a closed alert`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '', 'alert-design');
    const alert = page.getByTestId('alert').locator(':scope > *');
    const glyph = () => alert.locator('svg').first().evaluate(el => el.innerHTML);
    const tone = await glyph();
    await update(page, { icon: 'wallet' });
    await expect.poll(glyph).not.toBe(tone);
    await expect(alert.locator('svg')).toHaveCount(2);
    // No icon: the text starts on the padding edge and only the close glyph is left.
    await update(page, { icon: false, title: '', body: 'Alert body' });
    await expect(alert.locator('svg')).toHaveCount(1);
    expect((await box(alert.getByText('Alert body', { exact: true }))).x - (await box(alert)).x).toBeCloseTo(16, 0);
    // A keyboard close hands focus to the next control instead of dropping it on the page.
    await update(page, { icon: undefined, title: 'Alert title' });
    await alert.getByRole('button').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('events')).toHaveText('1/0');
    await expect(page.getByTestId('reference').getByRole('button')).toBeFocused();
    expect(errors).toEqual([]);
  });

  test(`${platform}: Alert actions sit beside an untitled message and under a titled one`, async ({ page }) => {
    await openFixture(page, platform, '', 'alert-design');
    const alert = page.getByTestId('alert').locator(':scope > *');
    for (const [size, height, padding] of [['sm', 40, 14], ['md', 52, 16], ['lg', 64, 20]] as const) {
      await update(page, { size, title: '', body: 'Alert body', actions: true, closable: false });
      const action = alert.getByRole('button', { name: 'Slot action', exact: true });
      // Beside the message the alert keeps its one-line height.
      await expect(alert).toHaveCSS('height', height + 'px');
      const [frame, button, icon] = [await box(alert), await box(action), await box(alert.locator('svg').first())];
      expect(frame.x + frame.width - (button.x + button.width)).toBeCloseTo(padding, 0);
      // Like the status icon and the close button, the button centres on the alert's first line box.
      expect(button.y + button.height / 2).toBeCloseTo(icon.y + icon.height / 2, 0);
      await update(page, { title: 'Alert title' });
      expect((await box(action)).y).toBeGreaterThan((await box(alert.getByText('Alert body', { exact: true }))).y);
    }
  });

  test(`${platform}: toast.loading, a wrapping compact toast and the close button states`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 640 });
    await openFixture(page, platform, '', 'toast-stack');
    await expect(toasts(page).first()).toBeVisible();
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    await expect(toasts(page)).toHaveCount(0);
    // A compact line longer than the screen wraps inside its capsule instead of being clipped.
    await page.evaluate(() => (window as any).feedback.toast.success('주문이 접수되었으며 배송 준비가 시작되면 알림으로 다시 알려 드립니다', { compact: true, duration: 0 }));
    const compact = toasts(page).first(), message = compact.getByText(/주문이 접수되었으며/);
    await expect(compact).toBeVisible();
    const [capsule, line] = [await box(compact), await box(message)];
    expect(line.x + line.width).toBeLessThanOrEqual(capsule.x + capsule.width);
    expect(capsule.x + capsule.width).toBeLessThanOrEqual(360);
    expect(line.height).toBeGreaterThan(24);
    // Korean wraps between words on every platform: the message keeps keep-all (Native Web like the web).
    await expect(message).toHaveCSS('word-break', 'keep-all');
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    // A loading toast stays with a close button until update turns it into its result.
    const id = await page.evaluate(() => (window as any).feedback.toast.loading('파일을 올리는 중입니다'));
    const card = toasts(page).first(), close = card.getByRole('button', { name: '알림 닫기', exact: true });
    await expect(card).toContainText('파일을 올리는 중입니다');
    await expect(close).toBeVisible();
    // Hover and press each paint a fill on web and Native Web alike.
    const rest = await fill(close);
    await close.hover();
    await expect.poll(() => fill(close)).not.toBe(rest);
    const hovered = await fill(close);
    await page.mouse.down();
    await expect.poll(() => fill(close)).not.toBe(hovered);
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.evaluate(id => (window as any).feedback.toast.update(id, { type: 'success', message: '올렸습니다', loading: false }), id);
    await expect(card).toContainText('올렸습니다');
  });
}
