import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.17.0 parity: Checkbox indeterminate, Progress null/indeterminate, KpiRow missing values and Tabs sticky header on every platform that has the concept.
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureParity(next), next);
const flat = (page: Page, id: string) => page.getByTestId(id).evaluate(el => (el as HTMLElement).innerText.replace(/\s+/g, ''));
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 2000 });
      await openFixture(page, platform, '', 'parity');
    });

    test('a mixed checkbox reports mixed, shows a minus and selects all when pressed', async ({ page }) => {
      const box = page.getByRole('checkbox', { name: 'Select all' });
      await expect(box).toBeChecked({ indeterminate: true });
      await expect(page.getByTestId('checkbox').locator('svg path[d="M5 12l14 0"]')).toHaveCount(1);
      await box.press('Space');
      await expect(page.getByTestId('changes')).toHaveText('[true]');
      await expect(box).toBeChecked();
      await expect(page.getByTestId('checkbox').locator('svg path[d="M5 12l14 0"]')).toHaveCount(0);
    });

    for (const shape of ['bar', 'circle']) test(`${shape} Progress keeps missing and unknown progress apart from 0%`, async ({ page }) => {
      const section = page.getByTestId(shape);
      await expect(section.getByRole('progressbar', { name: 'Upload' })).toHaveCount(0);
      await expect(section.getByRole('img', { name: /^Upload: / })).toHaveCount(1);
      await expect(section.getByRole('progressbar', { name: 'Default zero' })).toHaveAttribute('aria-valuenow', '0');
      expect(await flat(page, shape)).not.toContain('0%Default');
      await configure(page, { value: 50 });
      await expect(section.getByRole('progressbar', { name: 'Upload' })).toHaveAttribute('aria-valuenow', '50');
      await configure(page, { value: null, indeterminate: true });
      const busy = section.getByRole('progressbar', { name: 'Upload' });
      await expect(busy).not.toHaveAttribute('aria-valuenow');
      await expect(busy).toHaveAttribute('aria-busy', 'true');
      expect(await flat(page, shape)).not.toMatch(/Upload\d|^\d+%/);
      await configure(page, { indeterminate: false, value: 30, max: 0 });
      await expect(section.getByRole('img', { name: /^Upload: / })).toHaveCount(1);
    });

    test('KpiRow shows missing values without formatting and keeps a real zero', async ({ page }) => {
      expect(await flat(page, 'kpi')).toContain('Missing—Invalid—Customn/aZero0Loading');
      expect(await flat(page, 'kpi')).not.toMatch(/NaN|undefined|null/);
      await configure(page, { kpi: 0, loading: false });
      expect(await flat(page, 'kpi')).toContain('Missing$0%');
      expect(await flat(page, 'kpi')).toMatch(/Loading—$/);
    });

    test('Tabs keep a sticky header inside the scroll container', async ({ page }) => {
      test.skip(platform === 'native', 'Native has no sticky positioning; the app\'s ScrollView owns sticky headers');
      const scroll = page.getByTestId('scroll'), header = scroll.locator('.kjun-tabs-header');
      await scroll.evaluate(el => { el.scrollTop = 150; });
      await expect.poll(async () => Math.round((await header.boundingBox())!.y - (await scroll.boundingBox())!.y)).toBe(12);
      await expect(page.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
      await configure(page, { sticky: false });
      await expect(header).toHaveCSS('position', 'static');
    });
  });
}
