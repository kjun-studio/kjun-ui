import { test, expect, type Page } from '@playwright/test';

async function settledScroll(page: Page) {
  return page.evaluate(async () => {
    for (let i = 0; i < 8; i++) await new Promise(requestAnimationFrame);
    return scrollY;
  });
}

for (const platform of ['vue2', 'react', 'native']) {
  for (const width of [1440, 390]) {
    test(`${platform} ${width}: visible ButtonGroup interactions preserve document scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/components/button-group?platform=' + platform);
      await expect(page.locator('#preview .playground')).toHaveAttribute('data-ready', 'true');
      const preview = page.locator('#preview iframe');
      const buttons = page.frameLocator('#preview iframe').getByRole('button');
      await expect(buttons).toHaveCount(3);
      await preview.evaluate(async frame => {
        await document.fonts.ready;
        await (frame as HTMLIFrameElement).contentDocument!.fonts.ready;
        // Keep the buttons visible and away from the viewport center before clicking.
        window.scrollBy({ top: frame.getBoundingClientRect().top - (innerHeight - 240), behavior: 'instant' });
      });
      const before = await settledScroll(page);
      for (const index of platform === 'vue2' ? [1, 2, 0] : [2, 0]) {
        const button = buttons.nth(index);
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThan(200);
        expect(box!.y + box!.height).toBeLessThan(900);
        // Raw pointer input must not scroll the target into view as locator.click does.
        await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
        expect(Math.abs(await settledScroll(page) - before)).toBeLessThanOrEqual(1);
        await expect(button).toHaveAttribute('aria-pressed', 'true');
        await expect(button).toBeFocused();
      }
      await page.keyboard.press('Tab');
      const next = buttons.nth(platform === 'vue2' ? 1 : 2);
      await expect(next).toBeFocused();
      expect(Math.abs(await settledScroll(page) - before)).toBeLessThanOrEqual(1);
      await page.keyboard.press('Enter');
      await expect(next).toHaveAttribute('aria-pressed', 'true');
      expect(Math.abs(await settledScroll(page) - before)).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `artifacts/preview-scroll-${platform}-${width}.png` });
    });
  }
}
