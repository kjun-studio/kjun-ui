import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';
for (const platform of ['react', 'vue2', 'native']) test(`${platform}: window opening order controls paint and input independently of declaration order`, async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, platform, '', 'elevation');
  await page.evaluate(() => (window as any).elevation.openWindow());
  await expect(page.getByRole('button', { name: '새 창 행동' })).toBeVisible();
  await page.evaluate(() => (window as any).elevation.openParent());
  const current = page.getByRole('button', { name: '상위 팝업', exact: true });
  await expect(current).toBeVisible();
  await expect.poll(() => current.evaluate(el => {
    const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
  })).toBe(true);
  await current.click();
  await expect(page.getByRole('button', { name: '팝업 행동' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(current).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(current).toHaveCount(0);
  await page.getByRole('button', { name: '새 창 행동' }).click();
  await expect(page.getByTestId('actions')).toHaveText('1');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '카드 내부 행동' }).click();
});
