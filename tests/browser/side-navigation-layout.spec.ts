import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSideNavigationLayout: the column takes the width tokens open and collapsed, follows collapsed with the collapse
// motion, stays in view by default, and gives way to a drawer below the breakpoint.
const column = (page: import('@playwright/test').Page) => page.locator('.kjun-side-navigation-layout-nav');
const width = async (page: import('@playwright/test').Page) => Math.round((await column(page).boundingBox())!.width);

for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigationLayout widths: 256 open, 224 and 288 for sm and lg, 68 collapsed and 80 with rail names`, async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await openFixture(page, platform, '', 'side-navigation-layout');
    await expect.poll(() => width(page)).toBe(256);
    // The page starts right after the column.
    const box = (await column(page).boundingBox())!;
    expect(Math.round((await page.getByTestId('page').boundingBox())!.x - box.x)).toBe(256);
    await page.getByTestId('toggle').click();
    await expect.poll(() => width(page)).toBe(68);
    await expect(page.getByRole('navigation', { name: '작업 공간' })).toHaveAttribute('data-collapsed', '');
    await openFixture(page, platform, '?width=sm', 'side-navigation-layout');
    await expect.poll(() => width(page)).toBe(224);
    await openFixture(page, platform, '?width=lg', 'side-navigation-layout');
    await expect.poll(() => width(page)).toBe(288);
    await openFixture(page, platform, '?collapsed=1&labels=1', 'side-navigation-layout');
    await expect.poll(() => width(page)).toBe(80);
  });

  test(`${platform}: SideNavigationLayout keeps the column in view as the page scrolls, unless sticky is off`, async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 600 });
    await openFixture(page, platform, '', 'side-navigation-layout');
    await expect(column(page)).toHaveCSS('position', 'sticky');
    expect(Math.round((await column(page).boundingBox())!.height)).toBe(600);
    await page.mouse.wheel(0, 800);
    await expect.poll(async () => Math.round((await column(page).boundingBox())!.y)).toBe(0);
    await openFixture(page, platform, '?static=1', 'side-navigation-layout');
    await expect(column(page)).toHaveCSS('position', 'static');
  });

  test(`${platform}: SideNavigationLayout below the breakpoint opens the menu in a drawer and closes it on navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await openFixture(page, platform, '', 'side-navigation-layout');
    await expect(column(page)).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: '작업 공간' })).toHaveCount(0);
    await page.getByTestId('open').click();
    const drawer = page.getByRole('dialog', { name: '주요 탐색' });
    await expect(drawer).toBeVisible();
    // The drawer always shows the full menu.
    const nav = drawer.getByRole('navigation', { name: '작업 공간' });
    await expect(nav).not.toHaveAttribute('data-collapsed', /.*/);
    await nav.getByRole('link', { name: '프로젝트' }).click();
    await expect(page.getByTestId('value')).toHaveText('projects');
    await expect(drawer).toBeHidden();
    // Widening past the breakpoint brings the column back.
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect(column(page)).toHaveCount(1);
  });
}

test('native: SideNavigationLayout puts the menu beside the page and narrows it when collapsed (Native Web)', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await openFixture(page, 'native', '?wide=1', 'side-navigation-layout');
  const nav = page.getByRole('navigation', { name: '작업 공간' });
  await expect(nav).toBeVisible();
  const columnWidth = () => nav.evaluate(el => Math.round(el.parentElement!.getBoundingClientRect().width));
  await expect.poll(columnWidth).toBe(256);
  await page.getByTestId('toggle').click();
  await expect.poll(columnWidth).toBe(68);
});
