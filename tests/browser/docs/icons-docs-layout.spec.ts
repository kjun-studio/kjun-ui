import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { setIconFilled, setIconSize, chooseIcon, launchIcon } from './icons-docs-helpers';
import { layoutWidths, checksZoom } from './motion-docs-helpers';
async function layout(page: Page, platform: string) {
  await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/icons?platform=' + platform);
  await chooseIcon(page, 'adjustments-horizontal');
  for (const kind of ['selection', 'alignment', 'variants', 'toggle']) {
    const root = await launchIcon(page, kind), frame = root.frameLocator('iframe');
    expect(await frame.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), kind).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), kind).toBe(true);
  }
  await page.getByRole('button', { name: '검색 초기화', exact: true }).click();
  const clipped = await page.locator('.icon-card, .icon-detail, .icon-search').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.className));
  expect(clipped).toEqual([]);
}
for (const platform of ['react', 'vue2', 'native']) {
  for (const width of layoutWidths(platform, [320, 375, 1440])) test(`${platform}: icons fit ${width}px`, async ({ page }) => {
    test.setTimeout(180000); await page.setViewportSize({ width, height: 1000 });
    await layout(page, platform);
    await page.locator('#catalog').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/icons-review/${platform}-${width}.png`, fullPage: true });
  });
  if (checksZoom(platform)) test(`${platform}: actual browser 200% zoom`, async () => {
    test.setTimeout(180000);
    const directory = await mkdtemp('/tmp/kjun-icons-zoom-'); await mkdir(directory + '/Default');
    await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, args: ['--window-size=1440,1000'] });
    try {
      const page = context.pages()[0]; await layout(page, platform);
      expect(await page.evaluate(() => innerWidth)).toBe(720); expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(2, 3);
      await page.locator('.icon-detail > h3').scrollIntoViewIfNeeded();
      await expect(page.locator('.icon-detail > h3')).toBeInViewport();
      // Playwright's screenshot clip uses unzoomed coordinates; capture the real viewport.
      const session = await context.newCDPSession(page);
      const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(`artifacts/icons-review/${platform}-zoom-200.png`, Buffer.from(shot.data, 'base64'));
      await session.detach();
    } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
  });
  test(`${platform}: touch selection and example`, async ({ browser }) => {
    const context = await browser.newContext({ baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', isMobile: true, hasTouch: true, viewport: { width: 375, height: 812 } });
    try {
      const page = await context.newPage(); await page.goto('/icons?platform=' + platform);
      await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
      await page.getByLabel('이름·한국어 용도 검색').fill('heart');
      await page.locator('.icon-card').first().tap(); await setIconFilled(page);
      const root = await launchIcon(page); await expect(root.frameLocator('iframe').getByText('heart · 16' + (platform === 'native' ? ' 논리 단위' : 'px') + ' · 채움형')).toBeVisible();
    } finally { await context.close(); }
  });
}
