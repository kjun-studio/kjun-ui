import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { demoPalettes } from '../../shared/demo-colors';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureNavigation(next), next);
const nav = (page: Page) => page.getByRole('navigation', { name: '주요 탐색' });
const label = (page: Page, text: string) => nav(page).getByText(text, { exact: true });
const icon = (page: Page, text: string) => nav(page).getByRole('link', { name: new RegExp('^' + text) }).locator('svg');
const rect = async (item: ReturnType<typeof label>) => (await item.boundingBox())!;
const palettes = demoPalettes as Record<string, Record<string, string>>;
const rgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `rgb(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255})`; };
const navigationDivider = (palette: string) => rgb(palettes[palette].divider ?? palettes[palette].border);
// The fill a destination icon paints: a colour for the filled glyph, none for the outline one.
const iconFill = (page: Page, text: string) => icon(page, text).evaluate(svg => getComputedStyle(svg.querySelector('path')!).fill);
// The first full-width, 1px-tall paint on the bar's top edge: an inset shadow on the web, an overlay View on Native.
const topLine = (page: Page) => nav(page).evaluate(bar => {
  const shadow = getComputedStyle(bar).boxShadow.match(/^(rgba?\([^)]*\)) 0px (\d+)px 0px 0px inset$/);
  if (shadow) return { height: Number(shadow[2]), color: shadow[1] };
  const box = bar.getBoundingClientRect();
  const line = [...bar.children].find(n => { const r = n.getBoundingClientRect(); return r.top === box.top && r.width === box.width && r.height <= 1; });
  return line ? { height: line.getBoundingClientRect().height, color: getComputedStyle(line).backgroundColor } : null;
});
// The painted badge box around a count: its own element on the web, the bordered View on Native.
const badgeBox = (page: Page, text: string) => label(page, text).evaluate(el => {
  const box = el.closest('.kjun-navigation-badge') ?? el.parentElement!, css = getComputedStyle(box);
  return { height: Math.round(box.getBoundingClientRect().height - (css.boxShadow === 'none' ? 2 * parseFloat(css.borderTopWidth) : 0)), background: css.backgroundColor, color: getComputedStyle(el).color };
});

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: badges do not move icons or labels and selection uses ink and weight`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    for (const palette of ['default', 'dark']) {
      await openFixture(page, platform, '?palette=' + palette, 'bottom-navigation-design');
      await expect(nav(page)).toHaveCSS('height', '64px');
      await expect(nav(page)).toHaveCSS('border-top-width', '0px');
      // A 1px divider on the bar's top edge that adds no height.
      expect(await topLine(page)).toEqual({ height: 1, color: navigationDivider(palette) });
      await expect(page.locator('.kjun-navigation-indicator')).toHaveCount(0);
      expect(await iconFill(page, '홈')).not.toBe('none');
      expect(await iconFill(page, '활동')).toBe('none');
      const home = await rect(icon(page, '홈')), activity = await rect(icon(page, '활동'));
      expect(home.width).toBe(24); expect(home.height).toBe(24); expect(activity.y).toBe(home.y);
      expect((await rect(label(page, '홈'))).y).toBe((await rect(label(page, '활동'))).y);
      expect((await rect(label(page, '활동'))).y - activity.y - activity.height).toBe(4);
      const badge = await rect(label(page, '3'));
      expect(badge.y).toBeLessThan(activity.y); expect(badge.x).toBeGreaterThan(activity.x + 12);
      // An alert fill apart from the selection colour.
      expect(await badgeBox(page, '3')).toMatchObject({ height: 18, background: rgb(palettes[palette].danger), color: rgb(palettes[palette].onDanger ?? palettes[palette].inverse) });
      await expect(label(page, '홈')).toHaveCSS('font-size', '12px');
      await expect(label(page, '홈')).toHaveCSS('font-weight', '600');
      await expect(label(page, '활동')).toHaveCSS('font-weight', '500');
      const selectedInk = await label(page, '홈').evaluate(el => getComputedStyle(el).color);
      const unselectedInk = await label(page, '활동').evaluate(el => getComputedStyle(el).color);
      expect(selectedInk).not.toBe(unselectedInk);
      await label(page, '활동').click();
      await expect(nav(page).getByRole('link', { name: /활동/ })).toHaveAttribute('aria-current', 'page');
      await expect(label(page, '활동')).toHaveCSS('font-weight', '600');
      await expect(label(page, '활동')).toHaveCSS('color', selectedInk);
      await expect(label(page, '홈')).toHaveCSS('font-weight', '500');
      await expect(label(page, '홈')).toHaveCSS('color', unselectedInk);
      await expect.poll(() => iconFill(page, '홈')).toBe('none');
      expect(await rect(icon(page, '활동'))).toEqual(activity);
      await expect(page.getByTestId('events')).toHaveText('activity');
      await configure(page, { badge: null });
      expect(await rect(icon(page, '활동'))).toEqual(activity);
      await expect(nav(page)).toHaveCSS('height', '64px');
    }
  });

  test(`${platform}: navigation keeps keyboard focus, disabled destinations and consumer-owned selection`, async ({ page }) => {
    await openFixture(page, platform, '', 'bottom-navigation-design');
    const home = nav(page).getByRole('link', { name: '홈', exact: true }), activity = nav(page).getByRole('link', { name: /활동/ });
    await configure(page, { acceptNavigation: false });
    await home.focus(); await home.press('Tab'); await expect(activity).toBeFocused();
    await expect(activity).toHaveCSS('outline-style', 'solid');
    await activity.press('Enter');
    await expect(page.getByTestId('events')).toHaveText('activity');
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(activity).not.toHaveAttribute('aria-current', 'page');
    const disabled = label(page, '설정');
    const point = await rect(disabled); await page.mouse.click(point.x + point.width / 2, point.y + point.height / 2);
    await expect(page.getByTestId('events')).toHaveText('activity');
    await configure(page, { acceptNavigation: true }); await activity.press('Enter');
    await expect(activity).toHaveAttribute('aria-current', 'page');
    await configure(page, { safeAreaBottom: 24 }); await expect(nav(page)).toHaveCSS('height', '88px');
    await configure(page, { keyboardVisible: true }); await expect(nav(page)).toHaveCount(0);
    await configure(page, { hideOnKeyboard: false }); await expect(nav(page)).toBeVisible();
  });

  test(`${platform}: narrow, long-label, mixed-icon and text-only layouts remain aligned`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 600 });
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { count: 5, badge: '99+', long: true });
    const icons = await nav(page).locator('svg').all();
    const first = await rect(icons[0]);
    for (const item of icons) expect((await rect(item)).y).toBe(first.y);
    expect((await rect(nav(page))).height).toBeGreaterThanOrEqual(64);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await configure(page, { count: 3, long: false, mixed: true, badge: 0 });
    await expect(label(page, '0')).toBeVisible();
    expect((await rect(label(page, '활동'))).y).toBe((await rect(label(page, '홈'))).y);
    await configure(page, { icons: false });
    await expect(nav(page).locator('svg')).toHaveCount(0);
    await expect(nav(page)).toHaveCSS('height', '64px');
    const bar = await rect(nav(page)), text = await rect(label(page, '홈'));
    expect(text.y + text.height / 2).toBe(bar.y + bar.height / 2);
    await nav(page).getByRole('link', { name: /활동/ }).click();
    await expect(nav(page).getByRole('link', { name: /활동/ })).toHaveAttribute('aria-current', 'page');
  });
}
