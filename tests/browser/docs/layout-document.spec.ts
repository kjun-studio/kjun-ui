import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { sectionCount } from './docs-data';

test.use({ reducedMotion: 'reduce' });
async function ready(page: Page, platform = 'react', hash = '') {
  await page.goto('/layout?platform=' + platform + hash);
  await expect(page.locator('[data-example="GuideScreenLayout"]')).toHaveAttribute('data-ready', 'true');
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const item of await page.locator('.layout-figure, .layout-width-options, .layout-checklist, .layout-related').all()) {
    expect(await item.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  }
}
for (const width of [390, 1280, 1440]) test(`layout document: readable criteria, diagrams and controls at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await ready(page);
  await expect(page.locator('.layout-document > section')).toHaveCount(sectionCount('layout'));
  const body = page.locator('#width > .body-copy'), table = page.locator('#width .document-table');
  expect(await body.evaluate(el => [getComputedStyle(el).fontSize, getComputedStyle(el).lineHeight])).toEqual(['16px', '28px']);
  const b = (await body.boundingBox())!, t = (await table.boundingBox())!;
  expect(b.width).toBeLessThanOrEqual(720); expect(t.width).toBeCloseTo(b.width, 0); expect(t.x).toBeCloseTo(b.x, 0);
  const cell = table.locator('td').first();
  expect(await cell.evaluate(el => [getComputedStyle(el).fontSize, getComputedStyle(el).lineHeight, getComputedStyle(el).fontFamily])).toEqual(['14px', '20px', await body.evaluate(el => getComputedStyle(el).fontFamily)]);
  expect(await page.locator('.layout-gap-sample i').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height))).toEqual([16, 24, 32, 48]);
  const diagrams = await page.locator('.layout-cta-map').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
  expect(diagrams).toEqual([288, 288]);
  await expect(page.locator('#columns .layout-preview-hint')).not.toContainText('현재 가용 폭');
  if (width === 390) {
    await expect(page.getByRole('button', { name: '넓게 보기', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '375px 좁은 화면', exact: true })).toHaveCount(0);
    await expect(page.locator('.layout-diagram-hint')).toBeVisible();
  }
  await noOverflow(page);
  await mkdir('artifacts/layout-ux', { recursive: true });
  for (const id of ['width', 'spacing', 'columns', 'cta', 'platforms']) {
    await page.locator('#' + id).evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.screenshot({ path: `artifacts/layout-ux/${id}-${width}.png` });
  }
  await page.goto('/elevation?platform=react#shadows');
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
  if (width > 390) {
    const styles = await page.locator('#shadows .docs-table').evaluate(el => {
      const th = getComputedStyle(el.querySelector('th')!), td = getComputedStyle(el.querySelector('td:nth-child(2)')!);
      return [th.fontSize, td.fontSize, td.padding];
    });
    expect(styles).toEqual(['12px', '14px', '14px 12px']);
  }
});

for (const platform of ['vue2', 'react', 'native']) test(`${platform}: layout anchors, history and related links preserve the platform`, async ({ page }) => {
  await ready(page, platform, '#spacing');
  const nav = page.getByRole('navigation', { name: '상세 문서 바로가기' });
  await expect(nav.locator('[aria-current]')).toHaveText('폭·간격');
  await nav.getByRole('link', { name: '하단 CTA', exact: true }).click();
  await expect(page.locator('#cta')).toBeFocused();
  await expect(nav.locator('[aria-current]')).toHaveText('하단 CTA');
  await page.goBack();
  await expect(page).toHaveURL(new RegExp('platform=' + platform + '#spacing$'));
  await expect(nav.locator('[aria-current]')).toHaveText('폭·간격');
  for (const link of await page.locator('.layout-document a[href^="/"]').all()) {
    expect(await link.getAttribute('href')).toContain('platform=' + platform);
  }
  for (const id of ['width', 'columns', 'scroll', 'cta', 'platforms']) {
    await page.goto('/layout?platform=' + platform + '#' + id);
    await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
    await expect.poll(() => page.locator('#' + id).evaluate(el => el.getBoundingClientRect().top - document.querySelector('.document-shortcuts')!.getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(0);
  }
});

test('layout: wide comparison is offered only when it can show two columns', async ({ page }) => {
  await page.setViewportSize({ width: 1119, height: 1000 }); await ready(page);
  const example = page.locator('[data-example="GuideScreenLayout"]');
  await expect(example.getByRole('button', { name: '넓게 보기', exact: true })).toBeHidden();
  await page.setViewportSize({ width: 1120, height: 1000 });
  await example.getByRole('button', { name: '넓게 보기', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '열 전환 비교 · 넓게 보기' });
  await expect(dialog.frameLocator('iframe').getByTestId('foundation-area')).toContainText('2열');
  await expect(dialog.locator('.layout-preview-hint')).not.toContainText('넓게 보기');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog.locator('.layout-preview-hint')).toContainText('한 열');
  await expect(dialog.getByRole('button', { name: '375px 좁은 화면', exact: true })).toBeHidden();
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(dialog).toBeHidden(); await noOverflow(page);
});

test('layout: actual 200% zoom preserves readable document and live input', async () => {
  // A separate browser profile loads all three packed platforms in sequence.
  test.slow();
  const directory = await mkdtemp('/tmp/kjun-layout-ux-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, reducedMotion: 'reduce', baseURL: process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173', args: ['--window-size=1440,1000'] });
  context.setDefaultTimeout(30000);
  try {
    const page = context.pages()[0];
    for (const platform of ['vue2', 'react', 'native']) {
      await ready(page, platform);
      expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
      const example = page.locator('[data-example="GuideScreenLayout"]');
      await expect(example.getByRole('button', { name: '넓게 보기', exact: true })).toBeHidden();
      await example.frameLocator('iframe').getByRole('textbox', { name: '프로젝트 이름' }).fill('확대 화면 입력');
      await expect(example.frameLocator('iframe').getByRole('textbox', { name: '프로젝트 이름' })).toHaveValue('확대 화면 입력');
      await noOverflow(page);
    }
    await page.locator('#width').scrollIntoViewIfNeeded();
    const session = await context.newCDPSession(page);
    const shot = await session.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await mkdir('artifacts/layout-ux', { recursive: true });
    await writeFile('artifacts/layout-ux/zoom-200.png', Buffer.from(shot.data, 'base64'));
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
