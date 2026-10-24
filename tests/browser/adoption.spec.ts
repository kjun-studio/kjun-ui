import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.14.0 adoption additions: one block per feature, three platforms.
const section = (page: Page, id: string) => page.getByTestId(id);
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'adoption');
      await expect(section(page, 'external-feedback')).toBeVisible();
    });

    test('a confirm and a toast opened from a plain function show in the provider', async ({ page }) => {
      await section(page, 'external-feedback').getByRole('button', { name: 'open from function' }).click();
      await expect(page.getByRole('dialog').filter({ hasText: 'Opened from a function' }).last()).toBeVisible();
      await expect(page.getByText('Toast from a function', { exact: true })).toBeVisible();
    });
  });
}
