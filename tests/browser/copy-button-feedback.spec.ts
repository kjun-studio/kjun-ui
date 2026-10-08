import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: CopyButton reports success and failure through the optional feedback provider`, async ({ page }) => {
    await openFixture(page, platform, '?scenario=copy', 'api-contracts');

    await page.getByRole('button', { name: '복사 성공' }).click();
    await expect(page.getByRole('alert').filter({ hasText: '복사 완료' })).toBeVisible();

    await page.getByRole('button', { name: '복사 실패' }).click();
    await expect(page.getByRole('alert').filter({ hasText: '복사 실패' })).toBeVisible();
  });

  test(`${platform}: CopyButton remains usable outside the feedback provider`, async ({ page }) => {
    await openFixture(page, platform, '?scenario=copy-standalone', 'api-contracts');

    const success = page.getByRole('button', { name: '복사 성공' });
    await success.click();
    await expect(success).toContainText('복사 완료');

    await page.getByRole('button', { name: '복사 실패' }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
}
