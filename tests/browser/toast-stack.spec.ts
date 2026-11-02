import { test, expect, type Page } from '@playwright/test';
import { tokens } from '../../packages/tokens/dist/index.js';
import { openFixture } from './packed-fixture';
import { toasts } from './toast-locators';

// The fixture opens five toasts at once: an error, an info with an action, a success, a compact capsule and a warning.
const open = async (page: Page, platform: string, width: number) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width, height: 640 });
  await openFixture(page, platform, '', 'toast-stack');
  await expect(toasts(page).first()).toBeVisible();
};

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a wide stack keeps the error, lines its cards up and counts the toasts waiting behind`, async ({ page }) => {
    await open(page, platform, 1000);
    // maxToasts 3: the error stays shown even though four newer toasts arrived after it.
    await expect(toasts(page).filter({ hasText: '파일을 올리지 못했습니다' })).toBeVisible();
    await expect(toasts(page)).toHaveCount(3);
    await expect(page.getByRole('button', { name: '알림 모두 보기, 알림 2개 더', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: '알림', exact: true })).toBeVisible();
    // Several cards share one width; the capsule keeps its own.
    const warning = (await toasts(page).filter({ hasText: '저장 공간' }).boundingBox())!;
    const error = (await toasts(page).filter({ hasText: '파일을 올리지' }).boundingBox())!;
    expect(Math.abs(warning.width - error.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(warning.x + warning.width - (error.x + error.width))).toBeLessThanOrEqual(1);
    if (platform !== 'native') {
      // The inset is padding inside the stack, so card shadows have room instead of being clipped at its edge.
      await expect(page.locator('.kjun-toast-stack')).toHaveCSS('padding-right', tokens.extensions.toast.inset + 'px');
      await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
      expect((await toasts(page).filter({ hasText: '파일을 올리지' }).boundingBox())!.x).toBeLessThanOrEqual(tokens.extensions.toast.inset + 1);
    }
  });

  test(`${platform}: a narrow stack folds behind its error and unfolds on demand`, async ({ page }) => {
    await open(page, platform, 390);
    await expect(toasts(page)).toHaveCount(1);
    await expect(toasts(page)).toContainText('파일을 올리지 못했습니다');
    const more = page.getByRole('button', { name: '알림 모두 보기, 알림 4개 더', exact: true });
    await more.click();
    // Expanding shows every toast, including the two waiting beyond maxToasts, and the toggle now folds.
    await expect(toasts(page)).toHaveCount(5);
    await expect(page.getByRole('button', { name: '알림 접기', exact: true })).toBeVisible();
    // A press outside the stack folds it again.
    await page.mouse.click(200, 600);
    await expect(toasts(page)).toHaveCount(1);
  });

  test(`${platform}: a pointer on any toast holds the whole stack still`, async ({ page }) => {
    await open(page, platform, 1000);
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    await page.evaluate(() => { const f = (window as any).feedback; f.toast.info('잠깐 알림', { duration: 600 }); f.toast.info('붙잡은 알림', { duration: 0 }); });
    await toasts(page).filter({ hasText: '붙잡은 알림' }).hover();
    await page.waitForTimeout(1000);
    await expect(toasts(page).filter({ hasText: '잠깐 알림' })).toBeVisible();
    await page.mouse.move(10, 600);
    await expect(toasts(page).filter({ hasText: '잠깐 알림' })).toHaveCount(0, { timeout: 3000 });
  });

  test(`${platform}: a wide stack expands to its waiting toasts, folds with Escape and keeps focus on its toggle`, async ({ page }) => {
    await open(page, platform, 1000);
    const more = page.getByRole('button', { name: '알림 모두 보기, 알림 2개 더', exact: true });
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(toasts(page)).toHaveCount(5);
    const fold = page.getByRole('button', { name: '알림 접기', exact: true });
    await expect(fold).toBeFocused();
    if (platform !== 'native') {
      await page.keyboard.press('Escape');
      await expect(toasts(page)).toHaveCount(3);
      await expect(more).toBeFocused();
    }
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: a touch tap does not freeze the stack, and folded toasts still reach screen readers`, async ({ page }) => {
    await open(page, platform, 1000);
    await page.evaluate(() => (window as any).feedback.toast.clearAll());
    await page.evaluate(() => { const f = (window as any).feedback; f.toast.info('잠깐 알림', { duration: 600 }); f.toast.info('탭한 알림', { duration: 0 }); });
    await toasts(page).filter({ hasText: '탭한 알림' }).dispatchEvent('pointerover', { pointerType: 'touch', bubbles: true });
    await expect(toasts(page).filter({ hasText: '잠깐 알림' })).toHaveCount(0, { timeout: 3000 });
    await page.setViewportSize({ width: 390, height: 640 });
    await page.evaluate(() => { const f = (window as any).feedback; f.toast.clearAll(); f.toast.error('앞에 놓인 오류'); f.toast.info('접혀 있는 안내', { duration: 0 }); });
    await expect(toasts(page)).toHaveCount(1);
    await expect(page.locator('.kjun-toast-stack .kjun-sr-only[role="status"]')).toContainText('접혀 있는 안내');
  });
}
