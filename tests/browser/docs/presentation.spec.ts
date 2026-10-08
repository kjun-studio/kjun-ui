import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { presentations, overviewScenes, capture, captureProfiles, captureFor } from '../../../previews/presentation/registry.mjs';
import { preparePresentation } from '../../../scripts/presentation-capture.mjs';
const ready = (page: import('@playwright/test').Page) => expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
const noOverflow = async (page: import('@playwright/test').Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

test('80 packed presentation images share dimensions, definitions and unclipped capture evidence', async ({ request }) => {
  const manifest = await (await request.get('/previews/thumbnails/manifest.json')).json();
  expect(manifest.renderer).toBe('@kjun/react'); expect(manifest.capture).toEqual(capture);
  expect(manifest.captureProfiles).toEqual(captureProfiles);
  expect(Object.keys(manifest.images)).toHaveLength(77); expect(Object.keys(manifest.overviewImages)).toHaveLength(3);
  expect(new Set(Object.values(manifest.images)).size).toBe(77);
  expect(Object.keys(manifest.scenes).sort()).toEqual([...presentations, ...overviewScenes].map(s => s.name).sort());
  expect(new Set(Object.values(manifest.scenes).map((s: any) => s.url)).size).toBe(80);
  for (const definition of [...presentations, ...overviewScenes]) {
    const scene = manifest.scenes[definition.name], profile = captureFor(definition);
    expect(scene.captureType).toBe(definition.captureType); expect(scene.capture).toEqual(profile);
    expect(scene.geometry.viewport).toEqual({ width: definition.layer ? definition.width : profile.width, height: profile.height - (definition.layer ? 2 * profile.padding : 0) });
    const response = await request.get(scene.url); expect(response.ok(), scene.url).toBe(true);
    const bytes = await response.body(); expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1280, 800]);
    expect(scene.geometry.outside).toEqual([]); expect(scene.geometry.clipped).toEqual([]);
  }
});

test('overview fits desktop and mobile widths and entry links preserve platform', async ({ page }) => {
  await page.goto('/?platform=react'); await ready(page);
  for (const width of [1440, 900, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 }); await noOverflow(page);
    if ([1440, 390].includes(width)) await page.screenshot({ path: `artifacts/presentation-overview-${width}.png`, fullPage: true });
  }
  for (const [label, path] of [['시작하기', '/getting-started'], ['컴포넌트 보기', '/components']]) {
    const link = page.locator('.overview-actions').getByRole('link', { name: label, exact: true });
    await link.focus(); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(path + '?platform=react');
    await page.goBack(); await ready(page);
  }
});

test('representative capture scenes omit demo instructions and retain real package states', async ({ browser }) => {
  test.setTimeout(90000); // Each of the fourteen capture profiles opens a fresh browser context.
  for (const name of ['DsButton', 'DsButtonGroup', 'DsChip', 'DsInput', 'DsTable', 'DsModal', 'DsDrawer', 'DsMenuButton', 'DsDropdownItem', 'DsDropdownDivider', 'DsTabPane', 'DsAccordionItem', 'DsTooltip', 'DsPopover']) {
    const scene = presentations.find(s => s.name === name)!, capture = captureFor(scene);
    const context = await browser.newContext({ viewport: { width: capture.width, height: capture.height }, deviceScaleFactor: capture.deviceScaleFactor, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/previews/presentation.html?scene=' + name);
      await preparePresentation(page, scene);
      if (name === 'DsButton') {
        await expect(page.getByRole('button')).toHaveCount(3);
        await expect(page.getByRole('button').last()).toBeDisabled();
        expect(await page.getByRole('button').first().evaluate(el => el.getBoundingClientRect().height)).toBe(40);
      }
      if (name === 'DsButtonGroup') {
        await expect(page.getByRole('button')).toHaveText(['일간', '주간', '월간'], { useInnerText: true });
        await expect(page.getByRole('button', { name: '주간', exact: true })).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('.kjun-button-group')).toHaveCSS('height', '40px');
        await expect(page.getByRole('button').first()).toHaveCSS('font-size', '14px');
      }
      if (name === 'DsChip') {
        await expect(page.locator('.kjun-chip')).toHaveCount(3);
        await expect(page.locator('.kjun-chip').last()).toHaveAttribute('data-disabled', 'true');
        await expect(page.getByRole('button', { name: '팀 공유 삭제' })).toBeVisible();
        await expect(page.locator('.kjun-chip').first()).toHaveCSS('min-height', '32px');
        await expect(page.locator('.kjun-chip').first()).toHaveCSS('font-size', '14px');
      }
      if (['DsButton', 'DsButtonGroup', 'DsChip'].includes(name)) {
        const selector = name === 'DsButton' ? '.kjun-button' : name === 'DsButtonGroup' ? '.kjun-button-group' : '.kjun-chip';
        const measure = () => page.locator(selector).evaluateAll(elements => elements.map(el => {
          const r = el.getBoundingClientRect(), style = getComputedStyle(el);
          return { width: r.width, height: r.height, font: style.fontSize, radius: style.borderRadius, padding: style.padding, transform: style.transform, zoom: style.zoom };
        }));
        const actual = await measure(); expect(actual.length).toBeGreaterThan(0);
        // The same packed controls retain their CSS dimensions in the original 640px canvas.
        await page.setViewportSize({ width: 640, height: 400 });
        await page.evaluate(() => { document.documentElement.style.setProperty('--presentation-width', '640px'); document.documentElement.style.setProperty('--presentation-height', '400px'); });
        expect(await measure()).toEqual(actual);
        expect(actual.every(item => item.transform === 'none' && item.zoom === '1')).toBe(true);
      }
      if (scene.highlight) await expect(page.locator('.presentation-highlight')).toBeVisible();
      if (name === 'DsAccordionItem') { await expect(page.locator('.kjun-accordion-item')).toHaveCount(1); await expect(page.getByRole('button')).toHaveAttribute('aria-expanded', 'true'); }
      if (name === 'DsDropdownItem') await expect(page.getByRole('menuitem').first().locator('svg')).toHaveCount(2);
      if (name === 'DsMenuButton') { await expect(page.getByRole('button', { name: '목록 관리' })).toHaveText(''); await expect(page.getByRole('menu')).toBeVisible(); }
    } finally { await context.close(); }
  }
});

test('overview and gallery retain readable captions and links at actual 200% zoom', async () => {
  const directory = await mkdtemp('/tmp/kjun-presentation-zoom-'); await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, args: ['--window-size=1440,1000'] });
  try {
    const page = await context.newPage();
    for (const path of ['/?platform=react', '/components?platform=react']) {
      await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + path); await ready(page);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(2); await noOverflow(page);
      if (path.startsWith('/components')) {
        const width = await page.locator('.component-gallery').evaluate(el => el.clientWidth);
        expect(await page.locator('.gallery-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(width >= 1000 ? 3 : width >= 660 ? 2 : 1);
      }
      const link = path.startsWith('/?') ? page.locator('.overview-actions').getByRole('link', { name: '컴포넌트 보기', exact: true }) : page.locator('[data-component-card="DsButton"]');
      await link.focus(); await expect(link).toBeFocused();
      await expect(link).toBeInViewport();
      if (path.startsWith('/components')) {
        await link.locator('img').evaluate(img => (img as HTMLImageElement).decode());
        await link.locator('h2').scrollIntoViewIfNeeded();
      }
      const cdp = await context.newCDPSession(page);
      const shot = await cdp.send('Page.captureScreenshot', { captureBeyondViewport: false });
      await writeFile('artifacts/presentation-zoom-' + (path.startsWith('/?') ? 'overview' : 'gallery') + '.png', Buffer.from(shot.data, 'base64'));
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(path.startsWith('/?') ? /components\?platform=react$/ : /components\/button\?platform=react$/);
    }
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
