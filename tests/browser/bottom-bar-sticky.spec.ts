import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureNavigation(next), next);
const nav = (page: Page) => page.getByRole('navigation', { name: '주요 탐색' });
const box = async (locator: ReturnType<typeof nav>) => (await locator.boundingBox())!;
const rows = (page: Page) => page.getByTestId('page-row');
const scrollTo = (page: Page, y: number | 'end') => page.evaluate(y => window.scrollTo(0, y === 'end' ? document.documentElement.scrollHeight : y), y);
const viewport = { width: 390, height: 640 };

// sticky keeps the bar on the viewport's bottom edge while it keeps its own room in the page flow: nothing is measured,
// and the last content ends above the bar however tall the bar is.
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a sticky bottom bar stays on the viewport's bottom edge and never covers the last content`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openFixture(page, platform, '', 'bottom-navigation-design');
    for (const config of [{}, { showLabels: false }, { safeAreaBottom: 24 }]) {
      await configure(page, { sticky: true, page: 12, floating: false, showLabels: true, safeAreaBottom: 0, ...config });
      await scrollTo(page, 0);
      const bar = await box(nav(page));
      // Stuck to the bottom edge at the top of a long page.
      expect(Math.round(bar.y + bar.height)).toBe(viewport.height);
      await scrollTo(page, 'end');
      const end = await box(nav(page)), last = await box(rows(page).last());
      expect(Math.round(end.y + end.height)).toBe(viewport.height);
      // The last row ends where the bar's own room starts: the bar never covers it.
      expect(last.y + last.height).toBeLessThanOrEqual(end.y + 0.5);
    }
    // Hidden for the keyboard, the bar leaves no room behind.
    await scrollTo(page, 'end');
    const withBar = await page.evaluate(() => document.documentElement.scrollHeight);
    await configure(page, { keyboardVisible: true });
    await expect(nav(page)).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(withBar);
  });

  test(`${platform}: a sticky floating capsule keeps its offset from the bottom edge and leaves the last content clear`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { sticky: true, page: 12, floating: true });
    await scrollTo(page, 0);
    const capsule = await box(nav(page));
    expect(Math.round(viewport.height - capsule.y - capsule.height)).toBe(16);
    await scrollTo(page, 'end');
    const end = await box(nav(page)), last = await box(rows(page).last());
    expect(Math.round(viewport.height - end.y - end.height)).toBe(16);
    expect(last.y + last.height).toBeLessThanOrEqual(end.y + 0.5);
  });

  test(`${platform}: a bar without sticky stays in the page flow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openFixture(page, platform, '', 'bottom-navigation-design');
    await configure(page, { page: 12 });
    await scrollTo(page, 0);
    expect((await box(nav(page))).y).toBeGreaterThan(viewport.height);
  });
}
