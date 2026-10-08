import { expect, test, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureActionBar(next), next);
const bar = (page: Page) => page.getByTestId('bar').locator(':scope > *').first();
const save = (page: Page) => page.getByTestId('bar').getByRole('button', { name: '변경 사항 저장', exact: true });
const cancel = (page: Page) => page.getByTestId('bar').getByRole('button', { name: '취소', exact: true });
const description = (page: Page, text = '저장하면 모든 기기에 적용됩니다.') => page.getByTestId('bar').getByText(text, { exact: true });
const rect = async (node: Locator) => (await node.boundingBox())!;
async function clickAt(page: Page, node: Locator) {
  const r = await rect(node); await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
}
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: action bars stay flat and expand primary actions at their own compact width`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    for (const palette of ['default', 'dark']) {
      await openFixture(page, platform, '?palette=' + palette, 'bottom-action-bar-design');
      await expect(bar(page)).toHaveCSS('border-top-width', '0px');
      await expect(bar(page)).toHaveCSS('box-shadow', 'none');
      await expect(bar(page)).toHaveCSS('padding', '16px');
      await expect(description(page)).toHaveCSS('font-size', '14px');
      await expect(description(page)).toHaveCSS('line-height', '20px');
      await expect(description(page)).toHaveCSS('font-weight', '400');
      const outside = page.getByTestId('outside').getByRole('button', { name: '일반 저장', exact: true });
      const outsideWidth = (await rect(outside)).width;
      for (const direct of [false, true]) {
        await configure(page, { direct });
        for (const width of [320, 479, 480, 768, 360]) {
          await configure(page, { width });
          await expect.poll(async () => (await rect(bar(page))).width).toBe(width);
          const compact = width < 480;
          await expect(save(page)).toHaveCSS('flex-grow', compact ? '1' : '0');
          const b = await rect(bar(page)), d = await rect(description(page)), s = await rect(save(page)), c = await rect(cancel(page));
          expect(s.height).toBe(48); expect(c.height).toBe(48);
          expect(s.x + s.width).toBeCloseTo(b.x + b.width - 16, 0);
          expect(s.x - c.x - c.width).toBe(8);
          if (compact) {
            expect(s.y - d.y - d.height).toBe(12);
            expect(c.x).toBe(b.x + 16);
          } else {
            expect(Math.abs(s.y + s.height / 2 - d.y - d.height / 2)).toBeLessThan(1);
            expect(s.width).toBeLessThan(180);
          }
          expect((await rect(outside)).width).toBe(outsideWidth);
          expect(await bar(page).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        }
        await configure(page, { showCancel: false, description: '' });
        await expect(save(page)).toHaveCSS('width', '328px');
        await expect(bar(page)).toHaveCSS('height', '80px');
        await configure(page, { showCancel: true, description: '저장하면 모든 기기에 적용됩니다.' });
      }
      const long = 'https://example.com/' + 'project'.repeat(45);
      await configure(page, { width: 320, description: long });
      expect((await rect(description(page, long))).height).toBeGreaterThan(20);
      expect(await bar(page).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
  });

  test(`${platform}: responsive action bars preserve keyboard, loading, disabled, safe area and keyboard visibility`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await openFixture(page, platform, '', 'bottom-action-bar-design');
    await cancel(page).focus(); await cancel(page).press('Enter');
    await cancel(page).press('Tab'); await expect(save(page)).toBeFocused();
    await expect(save(page)).toHaveCSS('outline-width', '2px'); await save(page).press('Space');
    await expect(page.getByTestId('events')).toHaveText('cancel|save');
    await page.mouse.move(0, 0);
    const before = await rect(save(page));
    await configure(page, { loading: true });
    await expect(save(page)).toBeDisabled(); await expect(save(page)).toHaveAttribute('aria-busy', 'true');
    expect(await rect(save(page))).toEqual(before); await clickAt(page, save(page));
    await expect(page.getByTestId('events')).toBeEmpty();
    await configure(page, { loading: false }); await expect(save(page)).toBeEnabled();
    await configure(page, { disabled: true });
    await expect(save(page)).toBeDisabled(); await expect(cancel(page)).toBeDisabled();
    await clickAt(page, save(page)); await clickAt(page, cancel(page)); await expect(page.getByTestId('events')).toBeEmpty();
    await configure(page, { disabled: false, variant: 'danger' });
    await save(page).click(); await expect(page.getByTestId('events')).toHaveText('save');
    const original = await rect(bar(page));
    await configure(page, { safeAreaBottom: 34, keyboardVisible: true });
    await expect(bar(page)).toHaveCSS('padding-bottom', '50px');
    expect((await rect(bar(page))).height - original.height).toBe(34);
    expect((await rect(save(page))).width).toBe(before.width);
    await configure(page, { hideOnKeyboard: true }); await expect(save(page)).toHaveCount(0);
    await configure(page, { keyboardVisible: false, safeAreaBottom: -8 });
    await expect(save(page)).toBeVisible(); await expect(bar(page)).toHaveCSS('padding-bottom', '16px');
    await configure(page, { showConfirm: false });
    await expect(save(page)).toHaveCount(0); await expect(cancel(page)).toBeEnabled();
  });
}
