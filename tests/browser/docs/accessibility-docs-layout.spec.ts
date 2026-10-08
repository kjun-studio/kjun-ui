import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { platforms, layoutWidths, checksZoom } from './motion-docs-helpers';
import { launch, focusedVisible } from './accessibility-docs-helpers';
async function revealFormForCapture(page: Page) {
  await page.locator('[data-guide-case="accessibility-form"]').evaluate(node => {
    const header = document.querySelector('.document-shortcuts')!.getBoundingClientRect().bottom;
    window.scrollTo({ top: scrollY + node.getBoundingClientRect().top - header - 12, behavior: 'instant' });
  });
}
async function layout(page: Page, platform: string) {
  await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/accessibility?platform=' + platform);
  for (const kind of ['tabs', 'modal', 'form']) {
    const root = await launch(page, kind), frame = root.frameLocator('iframe');
    await focusedVisible(root);
    if (kind === 'tabs') {
      await page.keyboard.press('End');
      const tab = frame.getByRole('tab', { selected: true });
      expect(await tab.evaluate(node => {
        const box = node.getBoundingClientRect(), style = getComputedStyle(node);
        return box.left >= 0 && box.right <= innerWidth && style.outlineStyle !== 'none';
      })).toBe(true);
    }
    if (kind === 'modal') {
      await page.keyboard.press('Enter'); const dialog = frame.getByRole('dialog', { name: '작업 확인', exact: true });
      await expect(dialog).toBeVisible();
      await focusedVisible(root);
      await page.keyboard.press('Tab'); await focusedVisible(root);
      await page.keyboard.press('Shift+Tab'); await focusedVisible(root);
      expect(await dialog.evaluate(node => { const b = node.getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1; })).toBe(true);
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    }
    if (kind === 'form') {
      await frame.getByRole('button', { name: '오류 표시', exact: true }).click();
      await expect(frame.getByRole('textbox', { name: '목록 이름', exact: true })).toHaveAccessibleDescription(/다른 목록과 구분/);
      const defects = await frame.locator('body').evaluate(body => {
        const problems: string[] = [];
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode, el = node.parentElement;
          if (!el || !node.textContent?.trim() || !el.getClientRects().length || el.closest('script,style,[aria-hidden=true]')) continue;
          const range = document.createRange(); range.selectNodeContents(node);
          for (const box of range.getClientRects()) {
            let ancestor: HTMLElement | null = el;
            while (ancestor) {
              const style = getComputedStyle(ancestor), bound = ancestor.getBoundingClientRect();
              if (['hidden', 'clip'].includes(style.overflowY) && (box.top < bound.top - 1 || box.bottom > bound.bottom + 1)) problems.push(node.textContent!.trim());
              if (['hidden', 'clip'].includes(style.overflowX) && (box.left < bound.left - 1 || box.right > bound.right + 1)) problems.push(node.textContent!.trim());
              ancestor = ancestor.parentElement;
            }
          }
        }
        return problems;
      });
      expect(defects).toEqual([]);
    }
    expect(await frame.locator('body').evaluate(node => node.scrollWidth <= innerWidth + 1), kind).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(root.locator('.code-block, details')).toHaveCount(0);
  }
  await page.locator('#text-resize').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
for (const platform of platforms) {
  for (const width of layoutWidths(platform, [320, 375, 1440])) test(`${platform}: accessibility fits ${width}px`, async ({ page }) => {
    test.setTimeout(180000); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width, height: 1000 });
    await layout(page, platform); await revealFormForCapture(page);
    await page.screenshot({ path: `artifacts/accessibility-review/${platform}-${width}.png` });
  });
  for (const scale of checksZoom(platform) ? [1.5, 2] : []) test(`${platform}: accessibility real ${scale * 100}% browser zoom`, async () => {
    test.setTimeout(180000);
    const directory = await mkdtemp('/tmp/kjun-accessibility-zoom-'); await mkdir(directory + '/Default');
    await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(scale) / Math.log(1.2) } } }));
    const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', args: ['--window-size=1440,1000'] });
    context.setDefaultTimeout(30000);
    try {
      const page = context.pages()[0]; await layout(page, platform);
      expect(await page.evaluate(() => innerWidth)).toBe(Math.round(1440 / scale));
      expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(scale, 3);
      await revealFormForCapture(page);
      const session = await context.newCDPSession(page), shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      await mkdir('artifacts/accessibility-review', { recursive: true });
      await writeFile(`artifacts/accessibility-review/${platform}-zoom-${scale * 100}.png`, Buffer.from(shot.data, 'base64')); await session.detach();
    } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
  });
}
