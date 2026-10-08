import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { platforms, layoutWidths, checksZoom } from './motion-docs-helpers';
import { launchInteraction } from './interaction-docs-helpers';
import { focusedVisible } from './accessibility-docs-helpers';
async function layout(page: Page, platform: string) {
  await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/interaction?platform=' + platform);
  for (const kind of ['button', 'tabs', 'input', 'loading']) {
    const root = await launchInteraction(page, kind), frame = root.frameLocator('iframe');
    await focusedVisible(root);
    if (kind === 'tabs') {
      await page.keyboard.press('ArrowRight');
      await expect(frame.getByRole('tab', { name: '둘째 탭' })).toHaveAttribute('aria-selected', 'true');
      await focusedVisible(root); await page.keyboard.press('Tab'); await focusedVisible(root);
    } else if (kind === 'input') {
      await frame.getByRole('textbox', { name: '일반 입력', exact: true }).fill('긴 목록 이름을 입력하고 읽기 전용·비활성 값과 비교합니다');
      await page.keyboard.press('Tab'); await focusedVisible(root);
    } else {
      await page.keyboard.press('Enter');
      if (kind === 'loading') {
        await expect(frame.getByRole('button', { name: '완료로 처리', exact: true })).toBeEnabled();
        await focusedVisible(root);
      }
    }
    expect(await frame.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), kind).toBe(true);
    const clipped = await frame.locator('button, [role=button], label, [role=tab]').evaluateAll(nodes => nodes.filter(node => {
      const box = node.getBoundingClientRect();
      return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1 || node.scrollHeight > node.clientHeight + 2);
    }).map(node => {
      const box = node.getBoundingClientRect();
      return { text: node.textContent, left: box.left, right: box.right, viewport: innerWidth,
        scrollHeight: node.scrollHeight, clientHeight: node.clientHeight };
    }));
    if (clipped.length || (platform === 'native' && kind === 'tabs')) {
      await root.scrollIntoViewIfNeeded();
      const session = await page.context().newCDPSession(page);
      const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      const dimensions = await page.evaluate(() => `${innerWidth}-${devicePixelRatio}`);
      await mkdir('artifacts/interaction-review', { recursive: true });
      await writeFile(`artifacts/interaction-review/${platform}-${kind}-${dimensions}.png`, Buffer.from(shot.data, 'base64'));
      await session.detach();
    }
    expect(clipped, kind).toEqual([]);
    if (kind === 'loading') await root.screenshot({ path: `artifacts/interaction-review/${platform}-loading-${await page.evaluate(() => innerWidth)}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(root.locator('.code-block, details')).toHaveCount(0);
  }
  await page.locator('#composition').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
for (const platform of platforms) {
  for (const width of layoutWidths(platform, [320, 375, 1440])) test(`${platform}: interaction fits ${width}px`, async ({ page }) => {
    test.setTimeout(180000); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width, height: 1000 });
    await layout(page, platform); await page.screenshot({ path: `artifacts/interaction-review/${platform}-${width}.png` });
  });
  for (const scale of checksZoom(platform) ? [1.5, 2] : []) test(`${platform}: interaction real ${scale * 100}% browser zoom`, async () => {
    test.setTimeout(180000);
    const directory = await mkdtemp('/tmp/kjun-interaction-zoom-'); await mkdir(directory + '/Default');
    await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(scale) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', args: ['--window-size=1440,1000'] });
    context.setDefaultTimeout(30000);
    try {
      const page = context.pages()[0]; await layout(page, platform);
      expect(await page.evaluate(() => innerWidth)).toBe(Math.round(1440 / scale));
      expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(scale, 3);
      const session = await context.newCDPSession(page), shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await mkdir('artifacts/interaction-review', { recursive: true });
      await writeFile(`artifacts/interaction-review/${platform}-zoom-${scale * 100}.png`, Buffer.from(shot.data, 'base64')); await session.detach();
    } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
  });
  test(`${platform}: coarse pointer completes all examples without hover`, async ({ browser }) => {
    const context = await browser.newContext({ isMobile: true, hasTouch: true, viewport: { width: 375, height: 812 } });
    try {
      const page = await context.newPage(); await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/interaction?platform=' + platform);
      expect(await page.evaluate(() => matchMedia('(hover: none) and (pointer: coarse)').matches)).toBe(true);
      for (const kind of ['button', 'tabs', 'input', 'loading']) {
        const root = page.locator(`[data-guide-case="interaction-${kind}"]`);
        await root.getByRole('button', { name: '실행 예제 열기', exact: true }).tap();
        await expect(root.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
        const frame = root.frameLocator('iframe');
        if (kind === 'button') { await frame.getByRole('button', { name: '계속하기' }).tap(); await expect(frame.getByText('1번 실행했습니다')).toBeVisible(); }
        if (kind === 'tabs') { await frame.getByRole('tab', { name: '둘째 탭' }).tap(); await expect(frame.getByText('선택값: two')).toBeVisible(); }
        if (kind === 'input') { await frame.getByRole('button', { name: '프로젝트에서 값 갱신' }).tap(); await expect(frame.getByRole('textbox', { name: '일반 입력', exact: true })).toHaveValue('새 목록'); }
        if (kind === 'loading') { await frame.getByRole('button', { name: '저장', exact: true }).tap(); await frame.getByRole('button', { name: '완료로 처리', exact: true }).tap(); await expect(frame.getByText('저장했습니다.', { exact: true })).toBeVisible(); }
      }
    } finally { await context.close(); }
  });
}
