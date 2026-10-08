import { test, expect, chromium, type Page } from '@playwright/test';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import coverage from '../../../apps/docs/lib/generated/coverage.json' with { type: 'json' };
import discovery from '../../../apps/docs/lib/generated/discovery.json' with { type: 'json' };
import { searchDocuments } from '../../../shared/docs-search.mjs';
import { categoryFilterCount } from './docs-data';

const search = (page: Page) => page.getByRole('textbox', { name: '컴포넌트 검색어', exact: true });
const rows = (page: Page) => page.locator('.coverage-table-view tr:has([data-coverage-component]):visible, .coverage-card-view [data-coverage-component]:visible');
async function visit(page: Page, suffix = '') {
  await page.goto('/catalog' + suffix);
  await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function aligned(page: Page, id: string) {
  await expect.poll(() => page.locator('#' + id).evaluate(element => {
    const gap = element.getBoundingClientRect().top - document.querySelector('.topbar')!.getBoundingClientRect().bottom;
    const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    return gap >= 0 && (gap < 40 || (atEnd && element.getBoundingClientRect().bottom <= innerHeight));
  })).toBe(true);
}

test('all components, fixed totals, truthful platform scopes and original record downloads', async ({ page, request }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit(page);
  await expect(rows(page)).toHaveCount(coverage.components.length);
  expect(await rows(page).locator('.coverage-component-link').allTextContents()).toEqual(coverage.components.map(entry => entry.title));
  await expect(page.getByRole('table', { name: '컴포넌트 플랫폼 지원 비교' })).toBeVisible();
  await expect(page.getByRole('list', { name: '컴포넌트 플랫폼 지원 목록' })).toHaveCount(0);
  await expect(page.locator('.coverage-device-notice')).toContainText('iOS·Android 실제 기기와 시뮬레이터 검증은 수행하지 않았습니다.');
  // The legend lists only states that occur in the catalog, in their fixed order.
  const labels = { supported: '지원', preview: '미리보기', review: '확인 필요', unsupported: '미지원' } as const;
  const used = (Object.keys(labels) as (keyof typeof labels)[]).filter(status => coverage.components.some(entry => Object.values(entry.states).includes(status)));
  await expect(page.locator('.coverage-legend dt')).toHaveText(used.map(status => labels[status]));
  await expect(page.locator('.coverage-verdict')).toContainText(`공개 컴포넌트 ${coverage.total}개`);
  await page.screenshot({ path: 'artifacts/coverage-summary-desktop.png' });
  const summary = await page.locator('#support-summary').innerText();
  await search(page).fill('loadOptions');
  await expect(rows(page)).toHaveCount(1);
  expect(await page.locator('#support-summary').innerText()).toBe(summary);
  for (const service of coverage.services) {
    const card = page.locator(`[data-coverage-service="${service.name}"]`);
    await expect(card.getByRole('heading', { name: service.name, exact: true })).toBeVisible();
    await expect(card.locator('dd')).toHaveText(service.platforms.length === 3 ? ['제공', '제공', '제공'] : ['미제공', '미제공', '제공']);
  }
  for (const record of coverage.records) {
    const card = page.locator(`[id="record-${record.id}"]`);
    await expect(card.locator('time')).toHaveText(record.date);
    await expect(card).toContainText(`연결된 컴포넌트 ${record.componentCount}개`);
    const link = card.getByRole('link');
    await expect(link).toHaveAttribute('download', '');
    const response = await request.get((await link.getAttribute('href'))!);
    expect(response.status()).toBe(200);
    expect((await response.body()).equals(await readFile(record.source))).toBe(true);
  }
});

test('search relevance, categories, empty/reset and URL history preserve platform and anchor', async ({ page }) => {
  await visit(page, '?q=검색&category=inputs&platform=native#coverage');
  const filters = page.getByRole('group', { name: '컴포넌트 분류' });
  await expect(filters.getByRole('button')).toHaveCount(categoryFilterCount);
  await expect(search(page)).toHaveValue('검색');
  await expect(filters.getByRole('button', { name: /Inputs/ })).toHaveAttribute('aria-pressed', 'true');
  await filters.getByRole('button', { name: /Finance/ }).click();
  await expect(page).toHaveURL(url => url.searchParams.get('category') === 'finance' && url.searchParams.get('platform') === 'native' && url.hash === '#coverage');
  await page.goBack();
  await expect(filters.getByRole('button', { name: /Inputs/ })).toHaveAttribute('aria-pressed', 'true');
  await page.goForward();
  await expect(filters.getByRole('button', { name: /Finance/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(search(page)).toHaveValue('검색');
  await expect(filters.getByRole('button', { name: /Finance/ })).toHaveAttribute('aria-pressed', 'true');
  await search(page).fill('없는검색어987654');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '일치하는 컴포넌트가 없습니다' })).toBeVisible();
  await page.getByRole('button', { name: '전체 컴포넌트 보기', exact: true }).click();
  await expect(rows(page)).toHaveCount(coverage.components.length);
  await expect(page).toHaveURL(/\/catalog\?platform=native#coverage$/);
  for (const query of ['DsButton', '수량', '저장 폼', 'loadOptions']) {
    await search(page).fill(query);
    const expected = searchDocuments(discovery.documents.filter(document => document.component) as any, query).map(result => result.document.component);
    expect(await rows(page).evaluateAll(elements => elements.map(element => element.getAttribute('data-coverage-component') || element.querySelector('[data-coverage-component]')?.getAttribute('data-coverage-component')))).toEqual(expected);
  }
  await expect(rows(page).locator('.coverage-component-link')).toHaveAttribute('href', '/components/search-input?platform=native');
  await rows(page).getByRole('button', { name: 'SearchInput 플랫폼 차이·근거 펼치기', exact: true }).click();
  await expect(rows(page).getByRole('link', { name: 'SearchInput 상세 API', exact: true })).toHaveAttribute('href', '/components/search-input?platform=native#api');
  await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await expect(rows(page).locator('.coverage-component-link')).toHaveAttribute('href', '/components/search-input?platform=react');
  await expect(page).toHaveURL(url => url.searchParams.get('q') === 'loadOptions' && url.hash === '#coverage');
  await rows(page).locator('.coverage-component-link').click();
  await expect(page).toHaveURL(/\/components\/search-input\?platform=react$/);
});

test('720px content boundary and mobile cards retain expansion and expose only one view', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit(page, '?q=DsSearchInput&platform=vue2');
  const trigger = () => rows(page).getByRole('button', { name: /SearchInput 플랫폼 차이·근거/ });
  await trigger().click();
  await expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  for (const width of [720, 719, 720]) {
    await page.locator('.coverage-page').evaluate((element, width) => { (element as HTMLElement).style.width = width + 'px'; }, width);
    await expect(page.locator('.coverage-page')).toHaveCSS('width', width + 'px');
    await expect(page.getByRole('table')).toHaveCount(width === 720 ? 1 : 0);
    await expect(page.getByRole('list', { name: '컴포넌트 플랫폼 지원 목록' })).toHaveCount(width < 720 ? 1 : 0);
    await expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    const id = await trigger().getAttribute('aria-controls');
    await expect(page.locator('#' + id)).toBeVisible();
    await expect(page.locator('#' + id)).toContainText(coverage.components.find(entry => entry.name === 'DsSearchInput')!.differences);
  }
  await page.locator('.coverage-page').evaluate(element => { (element as HTMLElement).style.width = ''; });
  for (const width of [320, 390, 1600]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(search(page)).toHaveValue('DsSearchInput');
    await expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    await expect(rows(page).locator('.coverage-status')).toHaveText(['지원', '지원', '미리보기']);
    if (width < 720) await expect(rows(page).locator('dt')).toHaveText(['Vue 2', 'React', 'Native Web']);
    await noOverflow(page);
    for (const name of ['KjunProvider', 'KjunFeedbackProvider', 'DsFormLayout']) {
      const card = page.locator(`[data-coverage-service="${name}"]`);
      await expect(card.getByRole('heading')).toBeVisible();
      expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await rows(page).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/coverage-${width}.png` });
    await page.locator('#services').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/coverage-services-${width}.png` });
  }
  await trigger().focus(); await page.keyboard.press('Enter');
  await expect(trigger()).toHaveAttribute('aria-expanded', 'false');
  await expect(rows(page).getByRole('link', { name: 'SearchInput 상세 API' })).toHaveCount(0);
  await page.keyboard.press('Space');
  await expect(trigger()).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: '검색·분류 초기화', exact: true }).click();
  await search(page).fill('DsSearchInput');
  await expect(trigger()).toHaveAttribute('aria-expanded', 'true');
});

test('sticky comparison header and preserved anchors align below the document bar', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await visit(page, '?platform=react#coverage');
  await aligned(page, 'coverage');
  await page.mouse.wheel(0, 800);
  await expect.poll(() => page.locator('.coverage-table-view .kjun-table thead').evaluate(element => Math.abs(element.getBoundingClientRect().top - document.querySelector('.topbar')!.getBoundingClientRect().bottom))).toBeLessThan(2);
  for (const id of ['services', 'verification', 'coverage']) {
    await visit(page, '?platform=react#' + id);
    await aligned(page, id);
    await expect(page).toHaveURL(url => url.searchParams.get('platform') === 'react' && url.hash === '#' + id);
  }
  await search(page).fill('DsSearchInput');
  await rows(page).getByRole('button', { name: /펼치기/ }).click();
  await rows(page).getByRole('link', { name: /원본 기록 ·/ }).click();
  await expect(page.locator(locationSafeRecord())).toBeInViewport();
  for (const id of ['coverage', 'services', 'verification']) {
    await page.setViewportSize({ width: 390, height: 844 });
    await visit(page, '?platform=native#' + id);
    await aligned(page, id);
    await noOverflow(page);
  }
});
function locationSafeRecord() { return `[id="record-${coverage.components.find(entry => entry.name === 'DsSearchInput')!.recordId}"]`; }

test('actual 200% browser zoom keeps all statuses and service names readable', async () => {
  const directory = await mkdtemp('/tmp/kjun-coverage-zoom-');
  await mkdir(directory + '/Default');
  await writeFile(directory + '/Default/Preferences', JSON.stringify({ partition: { default_zoom_level: { x: Math.log(2) / Math.log(1.2) } } }));
  const context = await chromium.launchPersistentContext(directory, { channel: 'chromium', headless: true, viewport: null, args: ['--window-size=1440,1000'] });
  try {
    const page = context.pages()[0];
    await page.goto((process.env.KJUN_TEST_URL || 'http://127.0.0.1:4173') + '/catalog?platform=native');
    await expect(page.getByRole('button', { name: '문서 플랫폼', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => ({ width: innerWidth, ratio: devicePixelRatio }))).toEqual({ width: 720, ratio: 2 });
    // The unfiltered narrow list starts folded by category.
    await expect(page.locator('.coverage-group')).toHaveCount(new Set(coverage.components.map(entry => entry.category)).size);
    await expect(rows(page)).toHaveCount(0);
    await page.getByRole('button', { name: '모두 펼치기', exact: true }).click();
    await expect(rows(page)).toHaveCount(coverage.components.length);
    await expect(page.getByRole('table')).toHaveCount(0);
    for (const row of await rows(page).all()) {
      await expect(row.locator('dt')).toHaveText(['Vue 2', 'React', 'Native Web']);
      await expect(row.locator('.coverage-status')).toHaveText(['지원', '지원', '미리보기']);
      expect(await row.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
    await noOverflow(page);
    const cdp = await context.newCDPSession(page);
    const capture = async (path: string) => {
      // Capture Chrome's real zoomed viewport; Playwright's viewport:null clip is unscaled.
      await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
      const screenshot = await cdp.send('Page.captureScreenshot', { captureBeyondViewport: false });
      await writeFile(path, Buffer.from(screenshot.data, 'base64'));
    };
    await rows(page).first().evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await capture('artifacts/coverage-zoom-200.png');
    await page.locator('[data-coverage-service="KjunFeedbackProvider"]').evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await expect(page.locator('.coverage-service h3')).toHaveText(['KjunProvider', 'KjunFeedbackProvider', 'DsFormLayout']);
    for (const service of await page.locator('.coverage-service').all()) expect(await service.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await capture('artifacts/coverage-services-zoom-200.png');
  } finally { await context.close(); await rm(directory, { recursive: true, force: true }); }
});
