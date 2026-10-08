import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: a menu action opens a persistent modal and returns to the menu trigger`, async ({ page }) => {
    await openFixture(page, platform, '', 'elevation');
    const trigger = page.getByRole('button', { name: '화면 메뉴', exact: true });
    await trigger.click();
    await page.getByRole('menuitem', { name: '메뉴에서 새 창', exact: true }).click();
    await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
    await expect(page.getByRole('menuitem')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });
  test(`${platform}: fast reopening keeps focus and a changed Escape policy is honored`, async ({ page }) => {
    await openFixture(page, platform, '', 'elevation');
    const origin = page.getByRole('button', { name: '카드 내부 행동' });
    await origin.focus();
    await page.evaluate(() => { (window as any).elevation.openWindow(); (window as any).elevation.escape(false); });
    const action = page.getByRole('button', { name: '새 창 행동' });
    await expect(action).toBeVisible();
    const memo = page.getByRole('textbox', { name: '새 창 메모' });
    await memo.focus(); await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '닫기', exact: true })).toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(memo).toBeFocused();
    await action.focus(); await page.keyboard.press('Escape');
    await expect(action).toBeVisible();
    await page.evaluate(() => { (window as any).elevation.escape(true); (window as any).elevation.reopen(); });
    await expect(action).toBeVisible();
    await page.waitForTimeout(350);
    await action.focus(); await page.keyboard.press('Escape');
    await expect(action).toHaveCount(0);
    await expect(origin).toBeFocused();
    await origin.click();
    await expect(page.getByTestId('actions')).toHaveText('1');
  });
  test(`${platform}: removed popup trigger falls back to its live parent window`, async ({ page }) => {
    await openFixture(page, platform, '', 'elevation');
    await page.getByRole('button', { name: '상위 창 열기' }).click();
    await page.getByRole('button', { name: '상위 팝업', exact: true }).click();
    await page.getByRole('button', { name: '새 창 열기', exact: true }).click();
    await page.evaluate(() => (window as any).elevation.removeTrigger());
    await page.getByRole('button', { name: '새 창 닫기' }).click();
    // A closing window is already aria-hidden but retains its children until exit ends.
    await expect(page.getByRole('button', { name: '새 창 행동', includeHidden: true })).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"], [aria-modal="true"]'))).toBe(true);
    await page.keyboard.press('Tab');
    expect(await page.getByRole('button', { name: '카드 내부 행동' }).evaluate(el => el === document.activeElement)).toBe(false);
    await page.keyboard.press('Escape');
    await expect(page.getByText('긴 본문', { exact: true })).toHaveCount(0);
  });
  test(`${platform}: a moving toast keeps its elapsed lifetime and the page tooltip is dismissed`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.install({ time: new Date('2026-09-22T00:00:00Z') });
    await openFixture(page, platform, '', 'elevation');
    await page.mouse.move(1, 1); await page.mouse.move(4, 4);
    await page.getByRole('button', { name: '도움말', exact: true }).hover();
    await expect(page.getByText('짧은 도움말', { exact: true })).toBeVisible();
    // Assert elapsed lifetime independently of browser startup and CI rendering speed.
    await page.clock.pauseAt(new Date('2026-09-22T01:00:00Z'));
    await page.evaluate(() => (window as any).elevation.toast(1600));
    await expect(page.getByRole('alert')).toBeVisible();
    await page.clock.runFor(700);
    await page.evaluate(() => (window as any).elevation.openWindow());
    await expect(page.getByText('짧은 도움말', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('alert')).toBeVisible();
    // Flush deferred initial focus before checking that Toast did not capture it.
    await page.clock.runFor(16);
    await expect.poll(() => page.evaluate(() =>
      !!document.activeElement?.closest('[role="dialog"], [aria-modal="true"]'))).toBe(true);
    await page.clock.runFor(650);
    await page.evaluate(() => (window as any).elevation.closeWindow());
    await page.clock.runFor(300);
    await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 900 });
  });
}
