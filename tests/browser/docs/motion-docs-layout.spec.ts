import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { platforms, selectMotionExample, layoutWidths, checksZoom } from './motion-docs-helpers';
import { motionScenarios } from './docs-data';

async function checkLayout(page: Page, platform: string) {
  const base = process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173';
  await page.goto(base + '/motion?platform=' + platform);
  let stageSize: { width: number; height: number; top: number } | undefined;
  for (const kind of ['tabs', 'accordion', 'modal', 'drawer', 'toast', 'number']) {
    const root = await selectMotionExample(page, kind), frame = root.frameLocator('iframe');
    const size = await root.locator('.motion-preview-stage').evaluate(element => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height, top: box.top + scrollY };
    });
    if (stageSize) expect(size).toEqual(stageSize); else stageSize = size;
    if (kind === 'tabs') {
      const offset = await frame.getByRole('tablist').evaluate(node => {
        const box = node.getBoundingClientRect(); return Math.abs(box.left + box.width / 2 - innerWidth / 2);
      });
      expect(offset, platform + '/tabs centre').toBeLessThanOrEqual(2);
    }
    if (kind === 'modal' || kind === 'drawer') {
      const panel = platform === 'native' ? frame.locator('[aria-label="작업 확인"]') : frame.getByRole('dialog');
      await frame.getByRole('button', { name: kind === 'modal' ? '모달 열기' : '패널 열기', exact: true }).click();
      await expect(panel).toBeVisible();
      const bounds = await panel.evaluate(node => {
        const box = node.getBoundingClientRect();
        return { fits: box.left >= -1 && box.right <= innerWidth + 1 && box.top >= -1 && box.bottom <= innerHeight + 1 };
      });
      expect(bounds.fits, platform + '/' + kind).toBe(true);
      await frame.getByRole('button', { name: '닫기', exact: true }).press('Enter');
      await expect(frame.getByRole('dialog')).toHaveCount(0);
    }
    if (kind === 'toast') {
      await frame.getByRole('button', { name: '알림 3개 표시' }).click();
      await expect(frame.getByText('알림 3', { exact: true })).toBeVisible();
      const bounds = await frame.getByRole('alert').evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return { fits: box.left >= -1 && box.right <= innerWidth + 1 && box.top >= -1 && box.bottom <= innerHeight + 1, bottom: box.bottom };
      }));
      expect(bounds).toHaveLength(3);
      expect(bounds.every(box => box.fits), platform + '/toast').toBe(true);
      const triggerTop = await frame.getByRole('button', { name: '알림 3개 표시' }).evaluate(node => node.getBoundingClientRect().top);
      expect(Math.max(...bounds.map(box => box.bottom))).toBeLessThanOrEqual(triggerTop);
    }
    expect(await frame.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), kind).toBe(true);
    await expect(root.locator('details, .code-block')).toHaveCount(0);
    await expect(root.getByRole('link', { name: /상세 문서/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  for (const id of ['timing', 'easing-distance', 'reduced-motion']) {
    await page.locator('#' + id).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
}

for (const platform of platforms) {
  for (const width of layoutWidths(platform, [320, 375, 1440])) test(`${platform}: motion page fits ${width}px with working keyboard controls`, async ({ page }) => {
    test.setTimeout(180000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 1000 });
    await checkLayout(page, platform);
    await expect(page.locator('.motion-playground iframe')).toHaveCount(1);
    await expect(page.getByRole('tablist', { name: '모션 예제', exact: true }).getByRole('tab')).toHaveCount(motionScenarios.length);
    await page.locator('#examples > h2').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/motion-review/${platform}-${width}.png` });
  });

  if (checksZoom(platform)) test(`${platform}: motion page at real 200% browser zoom`, async () => {
    test.setTimeout(180000);
    const directory = await mkdtemp('/tmp/kjun-motion-zoom-');
    await mkdir(directory + '/Default');
    await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', args: ['--window-size=1440,1000'] });
    context.setDefaultTimeout(30000);
    try {
      const page = context.pages()[0];
      await checkLayout(page, platform);
      expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
      await page.locator('#examples > h2').scrollIntoViewIfNeeded();
      await expect(page.locator('#examples > h2')).toBeInViewport();
      // Capture the actual zoomed viewport without Playwright's unzoomed clip calculation.
      const session = await context.newCDPSession(page);
      const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await writeFile(`artifacts/motion-review/${platform}-zoom-200.png`, Buffer.from(shot.data, 'base64'));
      await session.detach();
    } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
  });
}
