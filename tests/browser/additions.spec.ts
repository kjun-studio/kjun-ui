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
      // A row with default (stretch) alignment keeps the compact pill at the top, as before.
      const defaultRow = (await section(page, 'badge-row-default').boundingBox())!;
      const compact = (await pill('Default row badge').boundingBox())!;
      expect(compact.height).toBeLessThanOrEqual(24);
      expect(Math.round(compact.y)).toBe(Math.round(defaultRow.y));
      // Layout keys in style still place the badge.
      const endColumn = (await section(page, 'badge-column-end').boundingBox())!;
      const end = (await pill('End badge').boundingBox())!;
      expect(Math.round(end.x + end.width)).toBe(Math.round(endColumn.x + endColumn.width));
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

    test('list rows share a 40px leading column, start dividers at the text and label a bare section title', async ({ page }) => {
      const list = section(page, 'icon-list');
      const rows = list.locator(platform === 'native' ? '[role="listitem"]' : '.kjun-list-row');
      await expect(rows).toHaveCount(3);
      const icon = (await rows.nth(0).locator('svg').first().boundingBox())!;
      expect(Math.round(icon.width)).toBe(20);
      const row = (await rows.nth(0).boundingBox())!;
      const alerts = (await list.getByText('Alerts', { exact: true }).boundingBox())!;
      const kim = (await list.getByText('Kim', { exact: true }).boundingBox())!;
      // Icon and avatar rows put their titles on one line: 16 inset + 40 column + 12 gap.
      expect(Math.round(alerts.x - row.x)).toBe(68);
      expect(Math.round(kim.x - row.x)).toBe(68);
      expect(Math.round(icon.x + icon.width / 2 - row.x)).toBe(36);
      await expect(list.getByText('Alerts', { exact: true })).toHaveCSS('font-weight', '600');
      const dividerStart = (index: number) => platform === 'native'
        ? rows.nth(index).evaluate(el => { const line = el.lastElementChild!.getBoundingClientRect(); return { left: line.left - el.getBoundingClientRect().left, height: line.height }; })
        : rows.nth(index).evaluate(el => { const line = getComputedStyle(el, '::after'); return { left: parseFloat(line.left), height: parseFloat(line.height) }; });
      expect(await dividerStart(0)).toEqual({ left: 68, height: 1 });
      expect(await dividerStart(1)).toEqual({ left: 68, height: 1 });
      if (platform !== 'native') expect(await rows.nth(2).evaluate(el => getComputedStyle(el, '::after').content)).toBe('none');
      const heading = list.getByText('Settings', { exact: true });
      await expect(heading).toHaveCSS('font-size', '12px');
    });

    test('link buttons hug their text', async ({ page }) => {
      const button = section(page, 'link-button').getByRole(platform === 'native' ? 'button' : 'button', { name: 'More' });
      const box = (await button.boundingBox())!;
      const text = (await section(page, 'link-button').getByText('More', { exact: true }).boundingBox())!;
      expect(box.width - text.width).toBeLessThanOrEqual(1);
      expect(Math.round(box.height)).toBe(20);
    });

    test('fab is a 56 circle at the bottom end and honours the safe area', async ({ page }) => {
      const fab = page.getByRole('button', { name: 'Add schedule' });
      const box = (await fab.boundingBox())!;
      expect(Math.round(box.width)).toBe(56);
      expect(Math.round(box.height)).toBe(56);
      expect(await fab.evaluate(el => parseFloat(getComputedStyle(el).borderTopLeftRadius))).toBeGreaterThanOrEqual(28);
      // Web pins it to the viewport; Native places it in its parent.
      const frame = platform === 'native' ? (await section(page, 'fab-area').boundingBox())! : { x: 0, y: 0, ...page.viewportSize()! };
      expect(Math.round(frame.x + frame.width - (box.x + box.width))).toBe(16);
      expect(Math.round(frame.y + frame.height - (box.y + box.height))).toBe(16 + 20);
    });

    if (platform === 'native') test('native font weights pick the matching face from a weight map', async ({ page }) => {
      const block = section(page, 'font-weights');
      const family = (text: string) => block.getByText(text, { exact: true }).evaluate(el => getComputedStyle(el).fontFamily);
      expect(await family('Body text')).toContain('Face-Regular');
      expect(await family('Label text')).toContain('Face-Medium');
      // 600 sits between 500 and 700; ties take the heavier face.
      expect(await family('Control text')).toContain('Face-Bold');
      expect(await block.getByRole('textbox').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Face-Regular');
      // A weighted span inside numeric text keeps the numeric family it inherits.
      expect(await family('USD')).toContain('Num-');
    });
  });
}
