import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { demoPalettes } from '../../shared/demo-colors';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureNavigation(next), next);
const nav = (page: Page) => page.getByRole('navigation', { name: '주요 탐색' });
const link = (page: Page, name: RegExp) => nav(page).getByRole('link', { name });
const rect = async (item: ReturnType<typeof link>) => (await item.boundingBox())!;
const palettes = demoPalettes as Record<string, Record<string, string>>;
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255})`; };
const fill = (item: ReturnType<typeof link>) => item.locator('svg').evaluate(svg => getComputedStyle(svg.querySelector('path')!).fill);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a centered capsule of icon-only circles inverts the selected destination`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    for (const palette of ['default', 'dark']) {
      await openFixture(page, platform, '?palette=' + palette, 'bottom-navigation-design');
      await configure(page, { floating: true });
      const colors = palettes[palette], bar = await rect(nav(page));
      const home = link(page, /^홈$/), activity = link(page, /^활동/);
      // 3 × 52px circles, 4px gaps and 6px padding, centered in the 390px frame (16px page padding).
      expect(bar.width).toBe(3 * 52 + 2 * 4 + 2 * 6);
      expect(bar.height).toBe(52 + 2 * 6);
      expect(Math.round(bar.x + bar.width / 2)).toBe(195);
      await expect(nav(page)).toHaveCSS('background-color', rgb(colors.surface));
      expect(await nav(page).evaluate(el => getComputedStyle(el).borderRadius)).toMatch(/^9999px|^\d{2,}px/);
      for (const item of [home, activity]) { const box = await rect(item); expect(box.width).toBe(52); expect(box.height).toBe(52); }
      // Labels are accessible names only.
      await expect(nav(page).getByText('홈', { exact: true })).toHaveCount(0);
      await expect(home).toHaveAttribute('aria-current', 'page');
      await expect(home).toHaveCSS('background-color', rgb(colors.text));
      expect(await fill(home)).toBe(rgb(colors.surface));
      expect(await fill(activity)).toBe('none');
      await expect(activity).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      const badge = nav(page).getByText('3', { exact: true });
      await expect(badge).toBeVisible();
      await activity.click();
      await expect(activity).toHaveAttribute('aria-current', 'page');
      await expect(activity).toHaveCSS('background-color', rgb(colors.text));
      await expect(home).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect.poll(() => fill(home)).toBe('none');
      await expect(page.getByTestId('events')).toHaveText('activity');
    }
  });

  test(`${platform}: empty badges draw nothing, the current destination reports a reselect and many destinations stay in the capsule`, async ({ page }) => {
    await openFixture(page, platform, '', 'bottom-navigation-design');
    for (const floating of [false, true]) {
      await configure(page, { floating, badge: '' });
      await expect(link(page, /^활동$/)).toBeVisible();
      await link(page, /^홈$/).click();
      await expect(page.getByTestId('events')).toHaveText('home|re:home');
    }
    await page.setViewportSize({ width: 320, height: 700 });
    await configure(page, { floating: true, count: 5, icons: false });
    const capsule = await nav(page).boundingBox();
    expect(capsule!.x).toBeGreaterThanOrEqual(15);
    expect(capsule!.x + capsule!.width).toBeLessThanOrEqual(305);
  });

  test(`${platform}: floating navigation keeps names, badges, disabled destinations and the safe area`, async ({ page }) => {
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { floating: true, badge: 128 });
    await expect(link(page, /^활동, 새 항목 128개$/)).toBeVisible();
    await expect(nav(page).getByText('99+', { exact: true })).toBeVisible();
    await configure(page, { badge: true });
    await expect(link(page, /^활동, 새 소식$/)).toBeVisible();
    // A dot carries no text.
    await expect(nav(page).getByText('99+', { exact: true })).toHaveCount(0);
    // A disabled destination keeps its link role and name.
    const settings = nav(page).getByRole('link', { name: '설정' }), before = (await settings.boundingBox())!;
    await expect(settings).toHaveAttribute('aria-disabled', 'true');
    await page.mouse.click(before.x + before.width / 2, before.y + before.height / 2);
    await expect(page.getByTestId('events')).toHaveText('');
    await expect(settings).not.toHaveAttribute('aria-current', 'page');
    const home = link(page, /^홈$/);
    await configure(page, { acceptNavigation: false });
    await home.focus(); await home.press('Tab');
    await expect(link(page, /^활동/)).toBeFocused();
    // 16px under the capsule, plus the safe area.
    const margin = () => nav(page).evaluate(el => getComputedStyle(el).marginBottom);
    expect(await margin()).toBe('16px');
    await configure(page, { safeAreaBottom: 24 });
    await expect.poll(margin).toBe('40px');
    await configure(page, { keyboardVisible: true }); await expect(nav(page)).toHaveCount(0);
    await configure(page, { hideOnKeyboard: false }); await expect(nav(page)).toBeVisible();
  });

  test(`${platform}: text-only destinations show their labels inside the capsule`, async ({ page }) => {
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { floating: true, icons: false });
    await expect(nav(page).locator('svg')).toHaveCount(0);
    const home = link(page, /^홈$/), box = await rect(home);
    await expect(nav(page).getByText('홈', { exact: true })).toBeVisible();
    expect(box.height).toBe(52); expect(box.width).toBeGreaterThan(52 - 1);
    await expect(nav(page).getByText('홈', { exact: true })).toHaveCSS('font-size', '14px');
  });
}
