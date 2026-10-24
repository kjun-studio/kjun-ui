import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.15.0 adopter requests: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'requests');
      await expect(section(page, 'after-close')).toBeVisible();
    });

    test('drawer and modal report once after the close finishes', async ({ page }) => {
      const area = section(page, 'after-close');
      for (const name of ['drawer', 'modal']) {
        await area.getByRole('button', { name: 'open ' + name, exact: true }).click();
        await page.getByRole('button', { name: 'close ' + name, exact: true }).click();
      }
      await expect(area.getByText('closes: Drawer gone, Modal gone', { exact: true })).toBeVisible();
    });

    test('reopening during the exit does not report a close', async ({ page }) => {
      const area = section(page, 'after-close');
      // Mounting closed layers reports nothing.
      await expect(area.getByText('closes: none', { exact: true })).toBeVisible();
      await area.getByRole('button', { name: 'open drawer', exact: true }).click();
      await page.getByRole('button', { name: 'reopen drawer', exact: true }).click();
      await expect(page.getByText('Drawer body', { exact: true })).toBeVisible();
      await page.waitForTimeout(600);
      await expect(area.getByText('closes: none', { exact: true })).toBeVisible();
    });

    test('list rows take an accessible name that includes the amount', async ({ page }) => {
      await expect(section(page, 'rows').getByRole('button', { name: 'Coffee, today, minus 4,500 won', exact: true })).toBeVisible();
    });

    test('row content sits below the description on the title start line', async ({ page }) => {
      const rows = section(page, 'rows');
      const title = (await rows.getByText('Coffee', { exact: true }).boundingBox())!;
      const description = (await rows.getByText('Today', { exact: true }).boundingBox())!;
      const budget = (await rows.getByText('Budget', { exact: true }).boundingBox())!;
      expect(Math.abs(budget.x - title.x)).toBeLessThan(1);
      expect(budget.y).toBeGreaterThanOrEqual(description.y + description.height);
    });

    test('text passes accessibility label and test id through', async ({ page }) => {
      await expect(section(page, 'text-props').getByTestId('balance')).toHaveAttribute('aria-label', 'Balance 1,000 won');
    });

    test('select and menu button return focus to the given element', async ({ page }) => {
      test.skip(platform === 'native', 'Web only: Native pickers have no keyboard focus to return');
      const area = section(page, 'return-focus'), cell = area.getByRole('textbox', { name: 'Target cell' });
      await area.getByRole('button', { name: /Unit select/ }).click();
      await page.getByRole('option', { name: 'Beta' }).click();
      await expect(cell).toBeFocused();
      await area.getByRole('button', { name: /Unit select/ }).click();
      await expect(page.getByRole('option', { name: 'Alpha' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(cell).toBeFocused();
      await area.getByRole('button', { name: 'Actions' }).click();
      await page.getByRole('menuitem', { name: 'Rename' }).click();
      await expect(cell).toBeFocused();
      await area.getByRole('button', { name: 'Actions' }).click();
      await expect(page.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(cell).toBeFocused();
    });

    test('combobox keeps focus while typing past a closed list', async ({ page }) => {
      test.skip(platform === 'native', 'Web only');
      const area = section(page, 'return-focus'), input = area.getByRole('combobox', { name: 'Unit search' });
      await input.fill('zz');
      await expect(input).toBeFocused();
      await input.fill('Al');
      await page.getByRole('option', { name: 'Alpha' }).click();
      await expect(area.getByRole('textbox', { name: 'Target cell' })).toBeFocused();
    });
  });
}
