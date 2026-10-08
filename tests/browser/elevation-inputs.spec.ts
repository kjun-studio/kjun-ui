import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
for (const platform of ['react', 'vue2', 'native']) for (const [label, option] of [['화면 자동완성', '자동완성 후보'], ['화면 검색 제안', '검색 후보']]) {
  test(`${platform}: ${label} restores focus without reopening suggestions`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'elevation');
    const input = page.getByRole(platform === 'native' ? 'textbox' : 'combobox', { name: label, exact: true }).first();
    await input.click();
    await expect(page.getByText(option, { exact: true })).toBeVisible();
    await page.evaluate(() => (window as any).elevation.openWindow());
    await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
    await expect(page.getByText(option, { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '새 창 닫기' }).click();
    await expect(input).toBeFocused();
    await expect(page.getByText(option, { exact: true })).toHaveCount(0);
    await input.click();
    await expect(page.getByText(option, { exact: true })).toBeVisible();
  });
}
