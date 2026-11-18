import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunColorPicker beyond the field trigger: the panel's name, the inline panel and the swatch/tool trigger variants.
const swatches = (scope: Page | ReturnType<Page['getByTestId']>) => scope.getByRole('radiogroup', { name: '견본 색' });

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1600 });
      await openFixture(page, platform, '?variants', 'color-picker');
    });

    test('the open panel is a dialog named by the picker label', async ({ page }) => {
      await page.getByTestId('cp-full').getByRole('button', { name: /^라벨 색/ }).click();
      // Native Web names the panel too, but its panel is no dialog role; the web packages make it one.
      if (web) await expect(page.getByRole('dialog', { name: '라벨 색' })).toBeVisible();
      else await expect(page.getByRole('slider', { name: '채도와 명도' })).toBeVisible();
      if (web) await expect(page.getByRole('slider', { name: '채도와 명도' })).not.toHaveAttribute('aria-roledescription');
      await page.keyboard.press('Escape');
      await page.getByTestId('cp-custom-trigger').getByRole('button', { name: /^커스텀 색/ }).click();
      if (web) await expect(page.getByRole('dialog', { name: '커스텀 색' })).toBeVisible();
    });

    test('an inline panel sits in the page, picks without opening and moves recent colors after a pick', async ({ page }) => {
      const inline = page.getByTestId('cp-inline');
      await expect(inline.getByRole('group', { name: '테마 색' })).toBeVisible();
      await expect(inline.getByRole('button', { name: /^테마 색/ })).toHaveCount(0);
      await swatches(inline).getByRole('radio', { name: '#22C55E' }).click();
      await expect(page.getByTestId('cp-inline-value')).toHaveText('#22C55E');
      // The gap between the selected swatch and its ring shows the inline fill, not the surface of a floating panel.
      const ground = await inline.getByRole('group', { name: '테마 색' }).evaluate(node => getComputedStyle(node).backgroundColor);
      const ring = await swatches(inline).getByRole('radio', { checked: true }).evaluate(node => getComputedStyle(node).boxShadow);
      expect(ring.match(/rgba?\([^)]*\)/)![0]).toBe(ground);
      await expect(page.getByTestId('cp-inline-recent')).toHaveText('["#22C55E","#0EA5E9"]');
      // A pick from the recent row keeps the row as it is under the pointer.
      await inline.getByRole('radiogroup', { name: '최근 사용 색' }).getByRole('radio', { name: '#0EA5E9' }).click();
      await expect(page.getByTestId('cp-inline-value')).toHaveText('#0EA5E9');
      await expect(page.getByTestId('cp-inline-recent')).toHaveText('["#22C55E","#0EA5E9"]');
      const hex = inline.getByRole('textbox', { name: 'HEX 색 코드' });
      await hex.fill('111111');
      await hex.press('Enter');
      await expect(page.getByTestId('cp-inline-value')).toHaveText('#111111');
      await expect(page.getByTestId('cp-inline-recent')).toHaveText('["#111111","#22C55E","#0EA5E9"]');
      const box = await inline.getByRole('group', { name: '테마 색' }).boundingBox();
      expect(Math.round(box!.width)).toBe(240);
    });

    test('swatch and tool triggers are square, read the value and open the panel', async ({ page }) => {
      const variants = page.getByTestId('cp-variants');
      const fill = variants.getByRole('button', { name: /^채움 색, #3B82F6/ }), tool = variants.getByRole('button', { name: /^글자 색, #EF4444/ });
      for (const button of [fill, tool]) {
        const box = await button.boundingBox();
        expect(Math.round(box!.width)).toBe(32); expect(Math.round(box!.height)).toBe(32);
      }
      const big = await variants.getByRole('button', { name: /^비활성 채움/ }).boundingBox();
      expect(Math.round(big!.width)).toBe(40);
      await tool.click();
      // The open panel is drawn after the inline one.
      await swatches(page).last().getByRole('radio', { name: '#22C55E' }).click();
      await page.keyboard.press('Escape');
      await expect(variants.getByRole('button', { name: /^글자 색, #22C55E/ })).toBeVisible();
      if (web) await expect(variants.locator('.kjun-color-indicator > span').first()).toHaveCSS('background-color', 'rgb(34, 197, 94)');
      await expect(variants.getByRole('button', { name: /^비활성 채움/ })).toBeDisabled();
    });
  });
}
