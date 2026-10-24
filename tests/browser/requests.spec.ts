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
  });
}
