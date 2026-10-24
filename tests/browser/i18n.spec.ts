import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunProvider locale/messages reach every KJUN string, including portalled feedback and screen-reader names.
const region = (page: Page, id: string) => page.getByTestId('region-' + id);
const dateText = (locale: string) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(2026, 9, 23));
async function confirmButtons(page: Page, id: string) {
  await region(page, id).getByRole('button', { name: 'confirm ' + id }).click();
  const dialog = page.getByRole('dialog').filter({ hasText: 'Proceed ' + id });
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const platform of ['react', 'vue3']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'i18n');
      await expect(region(page, 'none')).toBeVisible();
    });

    test('feedback confirm follows the provider locale', async ({ page }) => {
      const dialog = await confirmButtons(page, 'en');
      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    });

    test('en-US: close button, empty state, pager names and date value are English', async ({ page }) => {
      const en = region(page, 'en');
      await expect(en.getByText('No data', { exact: true })).toBeVisible();
      await expect(en.getByRole('button', { name: 'Previous page' }).first()).toBeVisible();
      await expect(en.getByRole('button', { name: 'Next page' }).first()).toBeVisible();
      await expect(en.getByText(dateText('en-US'))).toBeVisible();
      await en.getByRole('button', { name: 'modal en' }).click();
      await expect(page.getByRole('dialog', { name: 'Modal en' }).getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    });

    test('ja-JP: given messages win and the rest falls back to English', async ({ page }) => {
      const dialog = await confirmButtons(page, 'ja');
      await expect(dialog.getByRole('button', { name: 'キャンセル', exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
      await expect(region(page, 'ja').getByText(dateText('ja-JP'))).toBeVisible();
    });

    test('component props still win over messages', async ({ page }) => {
      const dialog = await confirmButtons(page, 'props');
      await expect(dialog.getByRole('button', { name: '그만', exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
    });

    test('invalid locale still renders with the English pack', async ({ page }) => {
      const dialog = await confirmButtons(page, 'invalid');
      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible();
      await expect(region(page, 'invalid').getByText('No data', { exact: true })).toBeVisible();
    });

    test('no locale keeps the Korean copy and date form', async ({ page }) => {
      const none = region(page, 'none');
      await expect(none.getByText('데이터가 없습니다', { exact: true })).toBeVisible();
      await expect(none.getByText('2026. 10. 23.')).toBeVisible();
      const dialog = await confirmButtons(page, 'none');
      await expect(dialog.getByRole('button', { name: '취소', exact: true })).toBeVisible();
    });
  });
}
