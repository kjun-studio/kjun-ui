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
// The fill a destination icon paints: a colour for the filled glyph, none for the outline one.
const iconFill = (page: Page, text: string) => icon(page, text).evaluate(svg => getComputedStyle(svg.querySelector('path')!).fill);
// The bar's edge: square corners and a shadow thrown upwards, with no hairline on its top edge.
const barEdge = (page: Page) => nav(page).evaluate(bar => {
  const css = getComputedStyle(bar), box = bar.getBoundingClientRect();
  const line = [...bar.children].some(n => { const r = n.getBoundingClientRect(); return r.top === box.top && r.width === box.width && r.height <= 1; });
  return { radius: [css.borderTopLeftRadius, css.borderTopRightRadius, css.borderBottomLeftRadius], shadow: css.boxShadow !== 'none' && !/inset/.test(css.boxShadow), line };
});
// The stroke an outline destination icon draws, in the icon's 24-unit grid.
const iconStroke = (page: Page, text: string) => icon(page, text).evaluate(svg => parseFloat(getComputedStyle(svg.querySelector('path')!).strokeWidth));
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
      await expect(nav(page)).toHaveCSS('height', '60px');
      await expect(nav(page)).toHaveCSS('border-top-width', '0px');
      expect(await barEdge(page)).toEqual({ radius: ['0px', '0px', '0px'], shadow: true, line: false });
      await expect(page.locator('.kjun-navigation-indicator')).toHaveCount(0);
      expect(await iconFill(page, '홈')).not.toBe('none');
      expect(await iconFill(page, '활동')).toBe('none');
      const home = await rect(icon(page, '홈')), activity = await rect(icon(page, '활동'));
      expect(home.width).toBe(28); expect(home.height).toBe(28); expect(activity.y).toBe(home.y);
      // Outline icons draw a 1.5 stroke at this size.
      expect(await iconStroke(page, '활동')).toBe(1.5);
      expect((await rect(label(page, '홈'))).y).toBe((await rect(label(page, '활동'))).y);
      expect((await rect(label(page, '활동'))).y - activity.y - activity.height).toBe(4);
      const badge = await rect(label(page, '3'));
      expect(badge.y).toBeLessThan(activity.y); expect(badge.x).toBeGreaterThan(activity.x + 12);
      // An alert fill apart from the selection colour.
      expect(await badgeBox(page, '3')).toMatchObject({ height: 16, background: rgb(palettes[palette].danger), color: rgb(palettes[palette].onDanger ?? palettes[palette].inverse) });
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
      await expect(nav(page)).toHaveCSS('height', '60px');
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
    await configure(page, { safeAreaBottom: 24 }); await expect(nav(page)).toHaveCSS('height', '84px');
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
    // A long label ends in an ellipsis on one line, so the bar keeps its height.
    expect((await rect(nav(page))).height).toBe(60);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await configure(page, { count: 3, long: false, mixed: true, badge: 0 });
    await expect(label(page, '0')).toBeVisible();
    expect((await rect(label(page, '활동'))).y).toBe((await rect(label(page, '홈'))).y);
    await configure(page, { icons: false });
    await expect(nav(page).locator('svg')).toHaveCount(0);
    await expect(nav(page)).toHaveCSS('height', '60px');
    const bar = await rect(nav(page)), text = await rect(label(page, '홈'));
    expect(text.y + text.height / 2).toBe(bar.y + bar.height / 2);
    await nav(page).getByRole('link', { name: /활동/ }).click();
    await expect(nav(page).getByRole('link', { name: /활동/ })).toHaveAttribute('aria-current', 'page');
  });

  test(`${platform}: iconStyle keeps one icon style for every destination and showLabels draws icons alone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { iconStyle: 'filled' });
    expect(await iconFill(page, '홈')).not.toBe('none'); expect(await iconFill(page, '활동')).not.toBe('none');
    await configure(page, { iconStyle: 'outline' });
    expect(await iconFill(page, '홈')).toBe('none'); expect(await iconFill(page, '활동')).toBe('none');
    // With outlines only, the selected destination takes the full stroke.
    expect(await iconStroke(page, '홈')).toBe(2); expect(await iconStroke(page, '활동')).toBe(1.5);
    await configure(page, { iconStyle: 'auto', showLabels: false });
    await expect(nav(page)).toHaveCSS('height', '56px');
    await expect(nav(page).getByText('홈', { exact: true })).toHaveCount(0);
    // The label stays the destination's accessible name.
    const home = nav(page).getByRole('link', { name: '홈', exact: true }), bar = await rect(nav(page)), glyph = await rect(icon(page, '홈'));
    await expect(home).toHaveAttribute('aria-current', 'page');
    expect(glyph.y + glyph.height / 2).toBe(bar.y + bar.height / 2);
    await nav(page).getByRole('link', { name: /활동/ }).click();
    await expect(nav(page).getByRole('link', { name: /활동/ })).toHaveAttribute('aria-current', 'page');
    // A text-only bar always shows its labels.
    await configure(page, { icons: false });
    await expect(label(page, '홈')).toBeVisible(); await expect(nav(page)).toHaveCSS('height', '60px');
  });

  test(`${platform}: a destination without an icon keeps its label on an icon-only bar, and disabled, wide and surfaceless bars follow their roles`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await openFixture(page, platform, '', 'bottom-navigation-design');
    // The mixed bar's second destination has no icon: with labels off it still shows its label, centered, badge after it.
    await configure(page, { mixed: true, showLabels: false });
    await expect(nav(page)).toHaveCSS('height', '56px');
    await expect(nav(page).getByText('홈', { exact: true })).toHaveCount(0);
    const plain = nav(page).getByRole('link', { name: /활동/ });
    await expect(plain).toContainText('활동');
    await expect(plain.locator('svg')).toHaveCount(0);
    // The label's own text box (the web label holds its badge too, so the text node is measured).
    const text = await plain.evaluate(el => { const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node: Node | null;
      while ((node = walker.nextNode())) if (node.textContent === '활동') { const range = document.createRange(); range.selectNodeContents(node); const r = range.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }
      return null; });
    const bar = await rect(nav(page)), count = await rect(label(page, '3'));
    expect(text).not.toBeNull();
    expect(Math.abs(text!.y + text!.height / 2 - (bar.y + bar.height / 2))).toBeLessThanOrEqual(0.5);
    expect(count.x).toBeGreaterThanOrEqual(text!.x + text!.width);
    // A disabled destination takes the disabled-text role at full opacity, a step below an unselected one.
    await configure(page, { mixed: false, showLabels: true });
    await expect(label(page, '설정')).toHaveCSS('color', rgb(palettes.default.textDisabled));
    await expect(label(page, '활동')).toHaveCSS('color', rgb(palettes.default.textTertiary));
    expect(await label(page, '설정').evaluate(el => { let node: Element | null = el, opacity = 1; while (node && node.getAttribute('role') !== 'navigation' && node.tagName !== 'NAV') { opacity *= Number(getComputedStyle(node).opacity); node = node.parentElement; } return opacity; })).toBe(1);
    // Without a surface the bar is seamless: no shadow.
    await configure(page, { surface: false });
    expect(await nav(page).evaluate(el => [getComputedStyle(el).borderTopLeftRadius, getComputedStyle(el).boxShadow])).toEqual(['0px', 'none']);
    // On a wide screen destinations stop at 168px and the group centers.
    await configure(page, { surface: true });
    await page.setViewportSize({ width: 1000, height: 600 });
    const wide = await rect(nav(page)), home = await rect(nav(page).getByRole('link', { name: '홈', exact: true })), activity = await rect(nav(page).getByRole('link', { name: /활동/ }));
    expect(home.width).toBe(168); expect(activity.x).toBe(home.x + 168);
    expect(Math.abs((home.x - wide.x) - (wide.x + wide.width - (home.x + 3 * 168)))).toBeLessThanOrEqual(1);
  });
}
