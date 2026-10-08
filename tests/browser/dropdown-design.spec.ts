import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { longMenuLabel } from '../fixtures/dropdown-design-cases';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureDropdown(next), next);
const panel = (page: Page, platform: string) => page.locator(platform === 'react' ? '.kjun-dropdown' : platform === 'vue2' ? '[role="menu"]' : '[aria-label="메뉴"]');
const item = (page: Page, text: string) => page.locator('[role="menuitem"], [role="menuitemradio"], [role="radio"]').filter({ hasText: text });

for (const platform of ['react', 'vue2', 'native']) {
  for (const trigger of ['plain', 'menu-button']) test(`${platform}: ${trigger} preserves selection and visible keyboard focus after portaling`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-design');
    const button = page.getByTestId(trigger).getByRole('button');
    await button.press('Enter');
    await expect(panel(page, platform)).toBeVisible();
    await expect(panel(page, platform)).toHaveCSS('border-radius', '12px');
    await expect(panel(page, platform)).toHaveCSS('width', '160px');
    const first = item(page, '첫 항목'), second = item(page, '둘째 항목');
    await expect(first).toHaveCSS('border-radius', '8px');
    await expect(first).toHaveCSS('height', '44px');
    await expect(first).toHaveCSS('padding', '8px 12px');
    await expect(first).toBeFocused();
    await expect(first).toHaveCSS('outline-style', 'solid');
    await expect(first).toHaveCSS('outline-width', '2px');
    await expect(first).toHaveCSS('outline-offset', '-2px');
    await expect(first).toHaveCSS('background-color', 'rgb(224, 237, 255)');
    if (trigger === 'menu-button') await page.screenshot({
      path: `artifacts/dropdown-design-${platform}-light.png`, clip: { x: 0, y: 0, width: 600, height: 320 },
    });
    await page.keyboard.press('Enter');
    await expect(panel(page, platform)).toBeHidden();
    await expect(page.getByTestId('events')).toHaveText('1');
    await button.press('Enter');
    await expect(first).toBeFocused();
    await first.hover();
    await expect(first).toHaveCSS('background-color', 'rgb(224, 237, 255)');
    await item(page, '비활성 항목').hover({ force: true });
    await expect(item(page, '비활성 항목')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(page.getByTestId('events')).toHaveText('1');
    await second.click();
    await expect(panel(page, platform)).toBeHidden();
    await expect(page.getByTestId('events')).toHaveText('2');
    await button.press('Enter');
    await expect(first).toBeFocused();
    await expect(second).toHaveCSS('background-color', 'rgb(224, 237, 255)');
    await expect(panel(page, platform)).toHaveCSS('width', '160px');
    await page.keyboard.press('Escape');
    await expect(panel(page, platform)).toBeHidden();
    await expect(button).toBeFocused();
  });

  test(`${platform}: menu grows with content, stays in a narrow viewport and consumes dark roles`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-design');
    await configure(page, { long: true, dark: true });
    const button = page.getByTestId('plain').getByRole('button');
    await button.press('Enter');
    await expect(item(page, longMenuLabel)).toBeVisible();
    await expect(item(page, longMenuLabel)).toBeFocused();
    const wide = (await panel(page, platform).boundingBox())!;
    expect(wide.width).toBeGreaterThan(240);
    await expect(panel(page, platform)).toHaveCSS('background-color', 'rgb(24, 24, 27)');
    await expect(item(page, longMenuLabel)).toHaveCSS('background-color', 'rgb(33, 58, 97)');
    await page.screenshot({ path: `artifacts/dropdown-design-${platform}-dark.png` });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 320, height: 640 });
    await button.press('Enter');
    await expect(item(page, longMenuLabel)).toBeVisible();
    await expect.poll(async () => {
      const rect = (await panel(page, platform).boundingBox())!;
      return rect.x >= 8 && rect.x + rect.width <= 312;
    }).toBe(true);
    expect(await item(page, longMenuLabel).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await page.screenshot({ path: `artifacts/dropdown-design-${platform}-narrow.png` });
  });

  test(`${platform}: one current item, muted leading icons, aligned labels and a shared divider role`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'dropdown-design');
    const button = page.getByTestId('plain').getByRole('button');
    await button.click();
    const second = item(page, '둘째 항목'), remove = item(page, '삭제');
    await expect(second).toBeVisible();
    // Leading icons use the secondary text role; danger keeps its role color.
    await expect(second.locator('svg').first()).toHaveCSS('color', 'rgb(82, 82, 91)');
    await expect(remove.locator('svg').first()).toHaveCSS('color', 'rgb(180, 35, 50)');
    const divider = panel(page, platform).locator('[role="separator"]');
    await expect(divider).toHaveCount(1);
    await expect(divider).toHaveCSS('background-color', 'rgb(212, 212, 216)');
    if (platform !== 'native') {
      // Pointer then keyboard: the item left under the pointer must not stay painted.
      await remove.hover();
      await expect(remove).toHaveCSS('background-color', 'rgb(252, 231, 234)');
      await page.keyboard.press('ArrowUp');
      await expect(second).toBeFocused();
      await expect(second).toHaveCSS('background-color', 'rgb(228, 228, 231)');
      await expect(remove).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    }
    await page.keyboard.press('Escape');
    await configure(page, { mixed: true });
    await button.click();
    await expect(second.locator('svg')).toHaveCount(1); // only the reserved selection check remains
    const start = async (text: string) => (await item(page, text).getByText(text, { exact: true }).boundingBox())!.x;
    expect(await start('둘째 항목')).toBeCloseTo(await start('첫 항목'), 0);
  });
}
