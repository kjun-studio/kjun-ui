import { expect, test, type Locator, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

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
  });
}
