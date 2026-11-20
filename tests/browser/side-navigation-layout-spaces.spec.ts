import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunSideNavigationLayout spaces: a band in the rail colour holds the spaces rail and a menu panel (a card or flat), the
// panel folds to leave the rail, focus follows the fold, and below the breakpoint the drawer holds both.
const column = (page: Page) => page.locator('.kjun-side-navigation-layout-nav');
const width = async (page: Page) => Math.round((await column(page).boundingBox())!.width);
const open = (page: Page, platform: string, query: string) => openFixture(page, platform, '?spaces=1&wide=1' + query, 'side-navigation-layout');
const rail = (page: Page) => page.getByRole('navigation', { name: '공간' });
const menu = (page: Page) => page.getByRole('navigation', { name: '메뉴' });
const style = (page: Page, selector: string, property: string) => page.locator(selector).first().evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property);

for (const platform of ['react', 'vue3']) {
  test.describe(`${platform}: SideNavigationLayout spaces`, () => {
    test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1200, height: 800 }); });

    test('card column is 284 with the page right after it, flat 276, collapsed 60', async ({ page }) => {
      await open(page, platform, '');
      await expect.poll(() => width(page)).toBe(284);
      const box = (await column(page).boundingBox())!;
      expect(Math.round((await page.getByTestId('page').boundingBox())!.x - box.x)).toBe(284);
      await open(page, platform, '&flat=1');
      await expect.poll(() => width(page)).toBe(276);
      await open(page, platform, '&closed=1');
      await expect.poll(() => width(page)).toBe(60);
    });

    test('rail band and panel differ, the selected space takes the background, the page has no background or radius', async ({ page }) => {
      await open(page, platform, '');
      const band = await style(page, '.kjun-side-navigation-layout-nav', 'background-color');
      const panel = await style(page, '.kjun-side-navigation-layout-panel', 'background-color');
      expect(band).not.toBe(panel);
      const current = await rail(page).locator('[aria-current]').evaluate(el => getComputedStyle(el).backgroundColor);
      expect(current).toBe(panel);
      expect(await style(page, '.kjun-side-navigation-layout-panel', 'border-top-left-radius')).toBe('12px');
      expect(await style(page, '.kjun-side-navigation-layout-main', 'background-color')).toBe('rgba(0, 0, 0, 0)');
      expect(await style(page, '.kjun-side-navigation-layout-main', 'border-top-left-radius')).toBe('0px');
      await open(page, platform, '&flat=1');
      expect(await style(page, '.kjun-side-navigation-layout-panel', 'border-top-left-radius')).toBe('0px');
      expect(await style(page, '.kjun-side-navigation-layout-panel', 'border-inline-end-width')).toBe('1px');
    });

    test('the panel head shows the title and a collapse button; collapsing moves focus to the expand button and back', async ({ page }) => {
      await open(page, platform, '');
      await expect(page.locator('.kjun-side-navigation-layout-panel-title')).toHaveText('프로젝트');
      const panel = page.locator('.kjun-side-navigation-layout-panel');
      await expect(panel).toHaveAttribute('aria-label', '메뉴 패널');
      const collapse = page.getByRole('button', { name: '메뉴 패널 접기' });
      await expect(collapse).toHaveAttribute('aria-expanded', 'true');
      await expect(collapse).toHaveAttribute('aria-controls', (await panel.getAttribute('id'))!);
      await collapse.click();
      await expect.poll(() => width(page)).toBe(60);
      await expect(panel).toBeHidden();
      const expand = page.getByRole('button', { name: '메뉴 패널 펼치기' });
      await expect(expand).toBeFocused();
      await expect(expand).toHaveAttribute('aria-expanded', 'false');
      await page.keyboard.press('Enter');
      await expect.poll(() => width(page)).toBe(284);
      await expect(page.getByRole('button', { name: '메뉴 패널 접기' })).toBeFocused();
    });

    test('rail icons do not move when the panel collapses, and start level with the first menu row', async ({ page }) => {
      await open(page, platform, '');
      const first = rail(page).locator('a').first();
      const before = (await first.boundingBox())!.y;
      expect(Math.abs(before - (await menu(page).locator('a').first().boundingBox())!.y)).toBeLessThanOrEqual(1);
      await page.getByRole('button', { name: '메뉴 패널 접기' }).click();
      await expect.poll(() => width(page)).toBe(60);
      expect((await first.boundingBox())!.y).toBe(before);
    });

    test('moves focus out when the app collapses the panel', async ({ page }) => {
      await open(page, platform, '');
      await menu(page).getByRole('link', { name: '브랜드 웹사이트' }).focus();
      await page.evaluate(() => (window as any).__collapse());
      await expect(page.getByRole('button', { name: '메뉴 패널 펼치기' })).toBeFocused();
    });

    test('moves focus to the expand button when the app collapses the panel while its collapse button has focus', async ({ page }) => {
      await open(page, platform, '');
      await page.getByRole('button', { name: '메뉴 패널 접기' }).focus();
      await page.evaluate(() => (window as any).__collapse());
      await expect(page.getByRole('button', { name: '메뉴 패널 펼치기' })).toBeFocused();
    });

    test('ignores collapsed and width with spaces, warning once', async ({ page }) => {
      const warnings: string[] = [];
      page.on('console', message => { if (message.type() === 'warning' && message.text().includes('do not apply with spaces')) warnings.push(message.text()); });
      // The warning is development-only, so this fixture is built in development mode.
      await openFixture(page, platform, '?spaces=1&wide=1&collapsed=1&width=lg', 'side-navigation-layout', 'development');
      await expect.poll(() => width(page)).toBe(284);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('collapsed');
      expect(warnings[0]).toContain('width');
    });

    test('the head keeps its height without a title, and a long title ends in an ellipsis', async ({ page }) => {
      await open(page, platform, '&title=none');
      await expect(page.locator('.kjun-side-navigation-layout-panel-title')).toHaveCount(0);
      expect(Math.round((await page.locator('.kjun-side-navigation-layout-panel-head').boundingBox())!.height)).toBe(40);
      await open(page, platform, '&title=long');
      const title = page.locator('.kjun-side-navigation-layout-panel-title');
      expect(await title.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      const head = (await page.locator('.kjun-side-navigation-layout-panel-head').boundingBox())!, button = (await page.getByRole('button', { name: '메뉴 패널 접기' }).boundingBox())!;
      expect(button.x + button.width).toBeLessThanOrEqual(head.x + head.width);
    });

    test('the drawer always shows the panel with a close button', async ({ page }) => {
      await page.setViewportSize({ width: 600, height: 800 });
      await openFixture(page, platform, '?spaces=1&drawer=1&closed=1', 'side-navigation-layout');
      await page.getByTestId('open').click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('navigation', { name: '공간' })).toBeVisible();
      await expect(dialog.getByRole('navigation', { name: '메뉴' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: '메뉴 패널 접기' })).toHaveCount(0);
      expect(Math.round((await dialog.locator('.kjun-side-navigation-layout-band').boundingBox())!.width)).toBe(284);
      await dialog.getByRole('button', { name: '닫기' }).click();
      await expect(dialog).toBeHidden();
    });

    test('without spaces nothing changes', async ({ page }) => {
      await openFixture(page, platform, '?wide=1', 'side-navigation-layout');
      await expect(page.locator('.kjun-side-navigation-layout')).not.toHaveAttribute('data-spaces', /.*/);
      await expect(page.locator('.kjun-side-navigation-layout-spaces, .kjun-side-navigation-layout-panel')).toHaveCount(0);
    });
  });
}

test.describe('native: SideNavigationLayout spaces (Native Web)', () => {
  const band = (page: Page) => page.locator('[data-kjun-side-navigation-layout-part="nav"]');
  const bandWidth = async (page: Page) => Math.round((await band(page).boundingBox())!.width);
  test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1200, height: 800 }); });

  test('the band is 284 with a card panel, 276 flat, 60 collapsed, with the page after it', async ({ page }) => {
    await open(page, 'native', '');
    await expect.poll(() => bandWidth(page)).toBe(284);
    const main = (await page.locator('[data-kjun-side-navigation-layout-part="main"]').boundingBox())!;
    expect(Math.round(main.x - (await band(page).boundingBox())!.x)).toBe(284);
    await open(page, 'native', '&flat=1');
    await expect.poll(() => bandWidth(page)).toBe(276);
    await open(page, 'native', '&closed=1');
    await expect.poll(() => bandWidth(page)).toBe(60);
  });

  test('the panel is a named region the toggles control', async ({ page }) => {
    await open(page, 'native', '');
    const panel = page.getByRole('region', { name: '메뉴 패널' });
    await expect(panel).toBeVisible();
    const id = await panel.getAttribute('id');
    expect(id).toMatch(/^kjun-side-panel-/);
    await expect(page.getByRole('button', { name: '메뉴 패널 접기' })).toHaveAttribute('aria-controls', id!);
  });

  test('collapsing keeps the menu mounted, so an open parent stays open', async ({ page }) => {
    await open(page, 'native', '');
    await menu(page).getByRole('button', { name: /문서/ }).click();
    await expect(menu(page).getByText('가이드')).toBeVisible();
    await page.getByRole('button', { name: '메뉴 패널 접기' }).click();
    await expect.poll(() => bandWidth(page)).toBe(60);
    await page.getByRole('button', { name: '메뉴 패널 펼치기' }).click();
    await expect.poll(() => bandWidth(page)).toBe(284);
    await expect(menu(page).getByText('가이드')).toBeVisible();
  });

  test('the drawer holds the rail and the panel with a close button', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 800 });
    await openFixture(page, 'native', '?spaces=1&drawer=1&closed=1', 'side-navigation-layout');
    await page.getByTestId('open').click();
    await expect(rail(page)).toBeVisible();
    await expect(menu(page)).toBeVisible();
    await expect(page.getByRole('button', { name: '메뉴 패널 접기' })).toHaveCount(0);
    await page.getByRole('button', { name: '닫기' }).click();
    await expect(menu(page)).toBeHidden();
  });
});

for (const platform of ['react', 'vue3']) {
  test(`${platform}: SideNavigationLayout spaces toggles take the menu's hover fill`, async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await open(page, platform, '');
    const collapse = page.getByRole('button', { name: '메뉴 패널 접기' });
    await collapse.hover();
    await expect.poll(() => collapse.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
  });
}
