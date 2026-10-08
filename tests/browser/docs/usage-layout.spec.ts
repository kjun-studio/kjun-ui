import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { layoutWidths, checksZoom } from './motion-docs-helpers';
async function layout(page: Page, platform: string, size: string) {
  const base = process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173';
  for (const path of ['/components/input', '/usage-guide/forms']) {
    await page.goto(base + path + '?platform=' + platform);
    const usage = page.locator(path.includes('components') ? '#usage' : '[data-implementation="GuideSettingsForm"]');
    await expect(usage.locator('pre')).toBeVisible();
    await usage.scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const node of await usage.locator('.code-block, .code-header, .usage-setup-links').all()) {
      expect(await node.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
    await expect(usage.locator('pre')).toHaveCSS('overflow-x', 'auto');
    await expect(usage.locator('pre')).toHaveCSS('max-height', '380px');
    if (platform === 'react' && size !== 'zoom') await usage.screenshot({ path: `artifacts/usage-separation/${path.includes('components') ? 'basic' : 'implementation'}-${size}.png` });
    await usage.locator('pre').focus(); await page.keyboard.press('ArrowRight');
    await expect(usage.locator('pre')).toBeFocused();
    await usage.locator('pre').evaluate(node => { node.scrollLeft = 0; (node as HTMLElement).blur(); });
  }
}
for (const platform of ['vue2', 'react', 'native']) {
  for (const width of layoutWidths(platform, [390, 1280, 1440])) test(`${platform}: code and setup links fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await layout(page, platform, String(width));
  });
  if (checksZoom(platform)) test(`${platform}: code and setup links at real 200% zoom`, async () => {
    const directory = await mkdtemp('/tmp/kjun-usage-zoom-');
    await mkdir(directory + '/Default');
    await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', args: ['--window-size=1440,1000'] });
    try {
      const page = context.pages()[0];
      await layout(page, platform, 'zoom');
      expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
      const session = await context.newCDPSession(page);
      const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await mkdir('artifacts/usage-separation', { recursive: true });
      await writeFile(`artifacts/usage-separation/${platform}-zoom.png`, Buffer.from(shot.data, 'base64'));
    } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
  });
}
