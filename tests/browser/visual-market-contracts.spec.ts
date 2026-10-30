import { test, expect } from '@playwright/test';
import { open, geometry, sameGeometry } from './visual-contract-helpers';

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: market loading and completion retain row and column geometry`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 375, 768, 1280]) for (const query of ['', '?fixed', '?no-actions', ...(platform === 'native' ? [] : ['?css', '?legacy'])]) {
      await page.setViewportSize({ width, height: 1000 });
      await open(page, platform, query);
      await expect(page.getByTestId('loaded').getByText('한빛테크', { exact: true })).toBeVisible();
      // Native onLayout first observes the containing width after mounting.
      await expect.poll(async () => (await geometry(page.getByTestId('loading'))).header.width).toBeGreaterThanOrEqual(400);
      const loading = await geometry(page.getByTestId('loading')), loaded = await geometry(page.getByTestId('loaded'));
      sameGeometry(loading, loaded);
      expect(loaded.header.height).toBeCloseTo(44, 0);
      for (const row of loaded.rows) expect(row.height).toBeCloseTo(70, 0);
      const before = await geometry(page.getByTestId('transition'));
      await page.getByRole('button', { name: '조회 완료' }).click();
      await expect(page.getByTestId('transition').getByText('한빛테크', { exact: true })).toBeVisible();
      sameGeometry(before, await geometry(page.getByTestId('transition')));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
