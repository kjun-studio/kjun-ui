import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: packed elevation roles preserve quiet cards and floating surfaces`, async ({ page, browserName }) => {
    for (const palette of ['default', 'dark']) {
    await openFixture(page, platform, '?palette=' + palette, 'elevation');
    for (const width of [320, 375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const flat = page.getByTestId('flat').locator(':scope > *');
      await expect(flat).toHaveCSS('box-shadow', 'none');
      await flat.hover();
      await page.getByRole('button', { name: '카드 내부 행동' }).focus();
      await expect(flat).toHaveCSS('box-shadow', 'none');
      await expect(flat).toHaveCSS('transform', 'none');
      await expect(page.getByTestId('raised').locator(':scope > *')).toHaveCSS('box-shadow', new RegExp(`${tokens.card.elevation.raised[0].blurRadius}px`));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByRole('button', { name: '화면 팝업', exact: true }).click();
    const surface = platform === 'native' ? page.getByLabel('화면 팝업 내용', { exact: true }) : page.locator('.kjun-content-popover');
    await expect(surface).toHaveCSS('box-shadow', new RegExp(`${tokens.extensions.popover.elevation[0].blurRadius}px`));
    await page.keyboard.press('Escape');
    await page.evaluate(() => (window as any).elevation.toast());
    await expect(page.getByRole('alert')).toHaveCSS('box-shadow', 'none');
    await page.getByRole('button', { name: '알림 행동' }).hover();
    await page.screenshot({ path: `artifacts/elevation/${platform}-${palette}-${browserName}-surfaces.png`, fullPage: true });
    await page.getByRole('button', { name: '알림 행동' }).click();
    await page.evaluate(() => (window as any).elevation.openWindow());
    const modal = page.locator(platform === 'react' ? '.kjun-modal' : platform === 'vue2' ? '.ds-modal-container' : '[aria-label="새 창"]');
    await expect(modal).toHaveCSS('box-shadow', new RegExp(`${tokens.modal.elevation[0].blurRadius}px`));
    await page.keyboard.press('Escape');
    }
  });
  test(`${platform}: popup launched window hides old popup and restores its original trigger`, async ({ page }) => {
    await openFixture(page, platform, '', 'elevation');
    const trigger = page.getByRole('button', { name: '화면 팝업', exact: true });
    await trigger.click();
    await page.getByRole('button', { name: '새 창 열기', exact: true }).click();
    await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
    await expect(page.getByRole('button', { name: '팝업 행동' })).toHaveCount(0);
    await page.getByRole('button', { name: '새 창 닫기' }).click();
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('button', { name: '팝업 행동' })).toHaveCount(0);
    await expect(page.getByTestId('closes')).toHaveText('1');
  });
  test(`${platform}: delayed controlled selection stays suppressed across a new window and Escape ignores IME`, async ({ page }) => {
    await openFixture(page, platform, '', 'elevation');
    await page.evaluate(() => (window as any).elevation.delay());
    await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '화면 선택', exact: true }).click();
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '둘째 옵션' })).toBeVisible();
    await page.evaluate(() => (window as any).elevation.openWindow());
    await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '둘째 옵션' })).toHaveCount(0);
    await page.getByRole('button', { name: '새 창 행동' }).evaluate(el => {
      for (const type of ['keydown', 'keyup']) el.dispatchEvent(new KeyboardEvent(type, { key: 'Escape', code: 'Escape', isComposing: true, bubbles: true }));
    });
    await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '새 창 행동' })).toHaveCount(0);
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '둘째 옵션' })).toHaveCount(0);
    await expect(page.getByTestId('closes')).toHaveText('1');
    await expect(page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '화면 선택', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await page.evaluate(() => (window as any).elevation.acknowledge());
    await page.getByRole(platform === 'vue2' ? 'combobox' : 'button', { name: '화면 선택', exact: true }).click();
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '둘째 옵션' })).toBeVisible();
  });
  test(`${platform}: nested windows, host clipping, toast action and unmount release input`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'elevation');
    await page.getByRole('button', { name: '상위 창 열기' }).click();
    const popupTrigger = page.getByRole('button', { name: '상위 팝업', exact: true });
    await popupTrigger.click();
    const popupAction = page.getByRole('button', { name: '새 창 열기', exact: true });
    await expect(popupAction).toBeVisible();
    expect(await popupAction.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
    await popupAction.click();
    await page.evaluate(() => (window as any).elevation.toast());
    await page.getByRole('button', { name: '알림 행동' }).click();
    await expect(page.getByTestId('actions')).toHaveText('1');
    await page.getByRole('button', { name: '새 창 닫기' }).click();
    await expect(popupTrigger).toBeFocused();
    await page.getByRole('button', { name: '중첩 패널' }).click();
    await expect(page.getByRole('button', { name: '패널 팝업' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: '패널 팝업' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '상위 팝업', exact: true })).toBeVisible();
    await page.evaluate(() => (window as any).elevation.unmount());
    await page.getByRole('button', { name: '카드 내부 행동' }).click();
    await expect(page.getByTestId('actions')).toHaveText('2');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });
}
