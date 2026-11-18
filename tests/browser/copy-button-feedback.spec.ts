import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { toasts } from './toast-locators';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: CopyButton reports success and failure through the optional feedback provider`, async ({ page }) => {
    await openFixture(page, platform, '?scenario=copy', 'api-contracts');

    await page.getByRole('button', { name: '복사 성공' }).click();
    await expect(toasts(page).filter({ hasText: '복사 완료' })).toBeVisible();

    await page.getByRole('button', { name: '복사 실패' }).click();
    await expect(toasts(page).filter({ hasText: '복사 실패' })).toBeVisible();
  });

  test(`${platform}: CopyButton remains usable outside the feedback provider`, async ({ page }) => {
    await openFixture(page, platform, '?scenario=copy-standalone', 'api-contracts');

    const success = page.getByRole('button', { name: '복사 성공' });
    await success.click();
    await expect(success).toContainText('복사 완료');
    // Without a provider the result is announced through a status region (Native Web too; devices speak it).
    await expect(page.getByRole('status').filter({ hasText: '복사 완료' })).toHaveCount(1);

    await page.getByRole('button', { name: '복사 실패' }).click();
    await expect(page.getByRole('status').filter({ hasText: '복사 실패' })).toHaveCount(1);
    await expect(toasts(page)).toHaveCount(0);
  });
}
