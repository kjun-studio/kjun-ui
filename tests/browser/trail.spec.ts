import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// 0.18.0: a Breadcrumb whose last item has `to` ends in a link, and ScrollFade scrolls and fades vertically.
const scroller = (page: Page) => page.getByTestId('vertical').locator('div').filter({ hasText: 'Row 1' }).first();
const box = (page: Page) => scroller(page).evaluate(el => {
  let node = el as HTMLElement;
  while (node && node.scrollHeight <= node.clientHeight) node = node.parentElement as HTMLElement;
  return { overflowY: getComputedStyle(node).overflowY, height: node.clientHeight, content: node.scrollHeight, mask: node.style.webkitMaskImage || node.style.maskImage };
});
for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await openFixture(page, platform, '', 'trail');
    });

    test('a last item with `to` is a link and no item claims the current page', async ({ page }) => {
      const trail = page.getByTestId('ancestors');
      await expect(trail.getByRole('link')).toHaveCount(2);
      await expect(trail.getByRole('link', { name: 'Work' })).toBeVisible();
      await expect(trail.locator('[aria-current]')).toHaveCount(0);
      if (platform === 'native') {
        await trail.getByRole('link', { name: 'Work' }).click();
        await expect(page.getByTestId('visited')).toHaveText('["Work"]');
      } else await expect(trail.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#work');
    });

    test('a last item without `to` stays the current page', async ({ page }) => {
      const trail = page.getByTestId('current');
      await expect(trail.getByRole('link')).toHaveCount(1);
      await expect(trail.getByRole('link', { name: 'Minutes' })).toHaveCount(0);
      if (platform !== 'native') await expect(trail.locator('[aria-current="page"]')).toHaveText(/Minutes/);
    });

    test('a vertical ScrollFade scrolls up and down inside its height', async ({ page }) => {
      const first = await box(page);
      expect(first.height).toBe(120);
      expect(first.content).toBeGreaterThan(first.height * 1.5);
      expect(first.overflowY).not.toBe('visible');
      if (platform === 'native') return;
      // Browsers drop the default `to bottom`; a horizontal fade would keep `to right`.
      expect(first.mask).toMatch(/^linear-gradient\((to bottom, )?currentcolor, .+, transparent\)$/i);
      await scroller(page).evaluate(el => { let node = el as HTMLElement; while (node.scrollHeight <= node.clientHeight) node = node.parentElement as HTMLElement; node.scrollTop = 100; });
      await expect.poll(async () => (await box(page)).mask).toMatch(/^linear-gradient\((to bottom, )?transparent, .+, transparent\)$/);
    });
  });
}
