import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { thumbColor } from '../fixtures/additions-cases';

// 0.13.0 additions: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'additions');
      await expect(section(page, 'switch-thumb')).toBeVisible();
    });

    test('switch thumb uses switchThumbOn when set and onBrand otherwise', async ({ page }) => {
      const thumbs = section(page, 'switch-thumb').locator(platform === 'native' ? '[role="switch"] > div > div:last-child' : '.kjun-switch-thumb');
      await expect(thumbs.nth(0)).toHaveCSS('background-color', thumbColor);
      // The demo palette leaves onBrand unset, so it falls back to inverse (#FFFFFF).
      await expect(thumbs.nth(1)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    });

    if (platform === 'native') test('native badge centers in a row and stays narrow in a column', async ({ page }) => {
      const pill = (text: string) => page.getByText(text, { exact: true }).locator('xpath=..');
      const row = await section(page, 'badge-row').boundingBox();
      const inRow = await pill('Row badge').boundingBox();
      expect(Math.abs(inRow!.y + inRow!.height / 2 - (row!.y + row!.height / 2))).toBeLessThanOrEqual(1);
      const column = await section(page, 'badge-column').boundingBox();
      expect((await pill('Column badge').boundingBox())!.width).toBeLessThan(column!.width / 2);
    });

    test('selected segment has an edge in the border color role', async ({ page }) => {
      const group = section(page, 'button-group');
      if (platform === 'native') {
        await expect(group.getByTestId('kjun-button-group-indicator')).toHaveCSS('border-top-width', '1px');
      } else {
        const shadow = await group.locator('.kjun-button-group-indicator').evaluate(el => getComputedStyle(el).boxShadow);
        expect(shadow).toContain('inset');
      }
    });

    test('date picker clear button empties the value', async ({ page }) => {
      const field = section(page, 'date-clear');
      await expect(field.getByText('2026. 10. 23.')).toBeVisible();
      await field.getByRole('button', { name: '날짜 지우기', exact: true }).click();
      await expect(field.getByText('날짜 선택', { exact: true })).toBeVisible();
      await expect(field.getByRole('button', { name: '날짜 지우기', exact: true })).toHaveCount(0);
    });

    test('switch description sits under the label and describes the control', async ({ page }) => {
      const block = section(page, 'switch-description');
      const label = await block.getByText('Alerts', { exact: true }).boundingBox();
      const description = await block.getByText('Sent once a day', { exact: true }).boundingBox();
      expect(Math.abs(description!.x - label!.x)).toBeLessThanOrEqual(1);
      expect(description!.y).toBeGreaterThanOrEqual(label!.y + label!.height - 1);
      if (platform !== 'native') await expect(block.getByRole('switch', { name: 'Alerts' })).toHaveAccessibleDescription('Sent once a day');
    });

    test('form group optional marker follows the locale', async ({ page }) => {
      await expect(section(page, 'optional-ko').getByText('(선택)', { exact: true })).toBeVisible();
      await expect(section(page, 'optional-en').getByText('(optional)', { exact: true })).toBeVisible();
    });

    test('circle buttons are as wide as they are tall and fully round', async ({ page }) => {
      for (const [name, height] of [['Add sm', 32], ['Add md', 40]] as const) {
        const button = section(page, 'circle-buttons').getByRole('button', { name });
        const box = (await button.boundingBox())!;
        expect(Math.round(box.width)).toBe(height);
        expect(Math.round(box.height)).toBe(height);
        const radius = await button.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius));
        expect(radius).toBeGreaterThanOrEqual(height / 2);
      }
    });

    test('lists without dividers draw no row borders and compact rows are 44 tall with the 16px inset', async ({ page }) => {
      const list = section(page, 'compact-list');
      const rows = list.locator(platform === 'native' ? '[role="listitem"]' : '.kjun-list-row');
      await expect(rows).toHaveCount(2);
      await expect(rows.first()).toHaveCSS('border-bottom-width', '0px');
      expect(Math.round((await rows.first().boundingBox())!.height)).toBe(44);
      const title = await list.getByText('Trip', { exact: true }).boundingBox();
      expect(Math.round(title!.x - (await rows.first().boundingBox())!.x)).toBe(16);
    });
  });
}
