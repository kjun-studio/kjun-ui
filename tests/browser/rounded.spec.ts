import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';

// 0.16.0 adopter requests: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
// The nearest ancestor (or self) that paints rounded corners.
const cornerOf = (target: Locator) => target.evaluate(el => {
  for (let n: Element | null = el; n; n = n.parentElement) { const r = getComputedStyle(n).borderTopLeftRadius; if (r !== '0px') return r; }
  return '0px';
});
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 2000 });
      await openFixture(page, platform, '', 'rounded');
      await expect(section(page, 'cards')).toBeVisible();
    });

    test('cards take the xl radius and lg stays 16', async ({ page }) => {
      expect(await cornerOf(section(page, 'cards').getByText('XL body', { exact: true }))).toBe('24px');
      expect(await cornerOf(section(page, 'cards').getByText('LG body', { exact: true }))).toBe('16px');
    });

    test('rounded list sections clip their rows', async ({ page }) => {
      const result = await section(page, 'lists').getByText('Rounded', { exact: true }).evaluate(el => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const style = getComputedStyle(n);
          if (style.borderTopLeftRadius !== '0px') return { radius: style.borderTopLeftRadius, overflow: style.overflow, holdsRows: n.textContent?.includes('Second row') };
        }
        return null;
      });
      expect(result).toEqual({ radius: '24px', overflow: expect.stringMatching(/hidden|clip/), holdsRows: true });
    });

    test('default sections stay square', async ({ page }) => {
      expect(await cornerOf(section(page, 'lists').getByText('Square row', { exact: true }))).toBe('0px');
    });

    test('the focus ring stays inside a rounded section', async ({ page }) => {
      test.skip(platform === 'native', 'Web focus outline');
      const lists = section(page, 'lists');
      await lists.getByText('Lists start', { exact: true }).click();
      await page.keyboard.press('Tab');
      const first = lists.getByRole('button', { name: 'First row' });
      await expect(first).toBeFocused();
      expect(parseFloat(await first.evaluate(el => getComputedStyle(el).outlineOffset))).toBeLessThan(0);
      // The square section keeps the existing ring.
      await lists.getByRole('button', { name: 'Square row' }).focus();
      await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      const square = lists.getByRole('button', { name: 'Square row' });
      await expect(square).toBeFocused();
      expect(parseFloat(await square.evaluate(el => getComputedStyle(el).outlineOffset))).toBeGreaterThanOrEqual(0);
    });

    // The painted background of the selected chip: the label's nearest ancestor with a background.
    // Chips also render an invisible copy of the label to reserve the bold width; read the shown one.
    const chipColors = (page: Page, label: string) => section(page, 'filters').getByText(label, { exact: true }).evaluateAll(all => {
      const el = all.find(n => getComputedStyle(n).opacity !== '0' && getComputedStyle(n).visibility !== 'hidden')!;
      let bg = ''; for (let n: Element | null = el; n; n = n.parentElement) { const c = getComputedStyle(n).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') { bg = c; break; } }
      return { bg, text: getComputedStyle(el).color };
    });

    test('selected filter chips use the filter roles', async ({ page }) => {
      expect(await chipColors(page, 'Every')).toEqual({ bg: 'rgb(10, 20, 200)', text: 'rgb(250, 250, 10)' });
    });

    test('without the roles selected chips keep text and inverse', async ({ page }) => {
      const colors = await page.evaluate(() => {
        const probe = document.querySelector('.kjun-scope') ?? document.body, style = getComputedStyle(probe);
        return { text: style.getPropertyValue('--kjun-text').trim(), inverse: style.getPropertyValue('--kjun-inverse').trim() };
      });
      const css = (v: string) => page.evaluate(value => { const i = document.createElement('i'); i.style.color = value; document.body.append(i); const c = getComputedStyle(i).color; i.remove(); return c; }, v);
      const chip = await chipColors(page, 'All');
      if (colors.text) expect(chip.bg).toBe(await css(colors.text));
      expect(chip.bg).not.toBe('rgb(10, 20, 200)');
    });

    const showTip = (page: Page, which: string) => section(page, 'tooltips').getByRole('button', { name: 'show ' + which, exact: true }).click();
    const path = '/Users/me/projects/kjun/packages/react/src/components/very-long-file-name.tsx';

    test('tooltip shows a bolder title above the body, capped by the width step and centred', async ({ page }) => {
      await showTip(page, 'path');
      const title = page.getByText('File path', { exact: true }), body = page.getByText(path, { exact: true });
      await expect(title).toBeVisible();
      const weight = (l: Locator) => l.evaluate(el => Number(getComputedStyle(el).fontWeight));
      expect(await weight(title)).toBeGreaterThan(await weight(body));
      const titleBox = (await title.boundingBox())!, bodyBox = (await body.boundingBox())!;
      expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(bodyBox.y + 1);
      // The long path wraps inside the sm step instead of widening the tooltip.
      expect(bodyBox.width).toBeLessThanOrEqual(tokens.extensions.tooltip.maxWidths.sm);
      expect(bodyBox.height).toBeGreaterThan(titleBox.height * 1.5);
      expect(await body.evaluate(el => getComputedStyle(el).textAlign)).toBe('center');
    });

    test('a title-only tooltip opens and an empty one does not', async ({ page }) => {
      await showTip(page, 'title');
      await expect(page.getByText('Only title', { exact: true })).toBeVisible();
      await showTip(page, 'empty');
      await expect(page.getByText('Only title', { exact: true })).toHaveCount(0);
      await expect(page.locator('[role="tooltip"]')).toHaveCount(0);
    });
  });
}
