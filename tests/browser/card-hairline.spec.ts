import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const platform of ['react', 'vue2', 'native']) for (const density of [1, 2]) {
  test(`${platform}: half-pixel card outline stays lighter at ${density}x density`, async ({ browser }) => {
    const context = await browser.newContext({ deviceScaleFactor: density, baseURL: 'http://127.0.0.1:4173' });
    try {
      const page = await context.newPage();
      await openFixture(page, platform, '', 'card-contract');
      await page.evaluate(() => (window as any).setCardContract({ border: true }));
      const card = page.getByTestId('contract-card').locator(':scope > *').first();
      const edgeInk = async () => {
        const png = await card.screenshot();
        return page.evaluate(async source => {
          const image = new Image(); image.src = source; await image.decode();
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
          const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0);
          const edge = ctx.getImageData(0, Math.floor(image.height / 2), 4, 1).data;
          return Array.from({ length: 4 }, (_, i) => 255 - edge[i * 4]).reduce((sum, value) => sum + value, 0);
        }, 'data:image/png;base64,' + png.toString('base64'));
      };
      const half = await edgeInk();
      await card.evaluate((element, platform) => {
        if (platform !== 'native') (element as HTMLElement).style.setProperty('--_kjun-geometry-card-border-width', '1px');
        else {
          const line = Array.from(element.children).find(child => getComputedStyle(child).boxShadow.includes('inset')) as HTMLElement;
          line.style.boxShadow = getComputedStyle(line).boxShadow.replace('0.5px', '1px');
        }
      }, platform);
      const full = await edgeInk();
      expect(half).toBeGreaterThan(0);
      expect(half).toBeLessThan(full * 0.75);
      expect(half).toBeGreaterThan(full * 0.25);
    } finally { await context.close(); }
  });
}
