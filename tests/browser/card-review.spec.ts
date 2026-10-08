import { test, expect, chromium, type Locator } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/dist/index.js';
import { longCardTitle } from '../fixtures/card-review-values';
const textStyle = (node: Locator) => node.evaluate(el => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node; while (node = walker.nextNode()) if (node.textContent?.trim()) {
    const s = getComputedStyle(node.parentElement!);
    return { size: s.fontSize, line: s.lineHeight, weight: s.fontWeight, color: s.color };
  }
  throw Error('No text');
});
const platforms = ['react', 'vue2', 'native'];
for (const platform of platforms) {
  test(`${platform}: packed card roles respond to geometry and foreground tokens`, async ({ page }) => {
    await openFixture(page, platform, '', 'card-review');
    const card = page.getByTestId('responsive-card').locator(':scope > *').first();
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(card.locator(':scope > *').first()).toHaveCSS('padding-top', tokens.card.padding.lg + 'px');
    }
    for (const [mode, color] of [['initial', 'rgb(170, 187, 204)'], ['changed', 'rgb(255, 255, 255)'], ['fallback', 'rgb(51, 68, 85)']]) {
      await page.evaluate(mode => (window as any).setCardPalette(mode), mode);
      for (const text of ['강조 제목', '강조 설명', '강조 본문', '강조 하단'])
        await expect.poll(async () => (await textStyle(page.getByTestId('primary-card').getByText(text, { exact: true }))).color).toBe(color);
      for (const text of ['내부 제목', '내부 본문', '유리 제목', '유리 본문'])
        expect((await textStyle(page.getByText(text, { exact: true }))).color).toBe('rgb(17, 17, 17)');
      expect((await textStyle(page.getByText('유리 설명', { exact: true }))).color).toBe('rgb(102, 102, 102)');
    }
  });

  test(`${platform}: long card titles wrap and header actions remain usable`, async ({ page }) => {
    await openFixture(page, platform, '', 'card-review');
    const narrow = page.getByTestId('narrow-card');
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect.poll(() => narrow.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const title = await narrow.getByText(longCardTitle, { exact: true }).boundingBox();
      const action = await narrow.getByRole('button', { name: '상세 보기' }).boundingBox();
      expect(title!.height).toBeGreaterThan(tokens.typography.cardTitle.lineHeightPx);
      // Header actions stay beside a title that fits and wrap below one that does not.
      expect(title!.x + title!.width <= action!.x + 1 || action!.y >= title!.y + title!.height - 1).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await narrow.screenshot({ path: `artifacts/card-review/${platform}-narrow.png` });
    const action = narrow.getByRole('button', { name: '상세 보기' });
    await action.click();
    await action.press('Enter');
    await expect(page.getByTestId('card-actions')).toHaveText('2');
  });

  test(`${platform}: alert roles and action icon geometry agree across sizes`, async ({ page }) => {
    await openFixture(page, platform, '', 'card-review');
    for (const size of ['sm', 'md', 'lg']) {
      const alert = page.getByTestId('alert-' + size);
      expect(await textStyle(alert.getByText('알림 제목', { exact: true }))).toMatchObject({
        size: size === 'sm' ? '12px' : '14px', line: size === 'sm' ? '16px' : '20px', weight: '600',
      });
      expect(await textStyle(alert.getByText('알림 설명', { exact: true }))).toMatchObject({
        size: size === 'sm' ? '12px' : '14px', line: size === 'sm' ? '16px' : '20px', weight: '400',
      });
      await alert.getByRole('button').click();
      await expect(alert.getByRole('alert')).toHaveCount(0);
    }
    for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
      const icon = page.getByTestId('icon-' + size).locator('svg');
      expect(await icon.evaluate(el => ({ width: getComputedStyle(el).width, height: getComputedStyle(el).height }))).toEqual({
        width: tokens.button.iconSizes[size] + 'px', height: tokens.button.iconSizes[size] + 'px',
      });
    }
    for (const size of ['xs', 'sm', 'md'] as const)
      await expect(page.getByTestId('copy-' + size).locator('svg')).toHaveCSS('width', tokens.button.iconSizes[size] + 'px');
    const toggle = page.getByRole('button', { name: '아이콘 lg', exact: true });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.press(' ');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });
}

test('long card titles and actions fit at actual 200% browser zoom', async () => {
  test.setTimeout(120000);
  const directory = await mkdtemp('/tmp/kjun-card-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null,
    baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=780,1100'] });
  try {
    const page = context.pages()[0];
    for (const platform of platforms) {
      await openFixture(page, platform, '', 'card-review');
      expect(await page.evaluate(() => ({ ratio: devicePixelRatio, width: innerWidth }))).toEqual({ ratio: 2, width: 390 });
      const narrow = page.getByTestId('narrow-card');
      expect(await narrow.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      await narrow.getByRole('button', { name: '상세 보기' }).click();
      await expect(page.getByTestId('card-actions')).toHaveText('1');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
