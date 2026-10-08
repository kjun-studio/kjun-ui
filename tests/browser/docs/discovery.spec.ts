import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
const index = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json', 'utf8'));
const components = index.documents.filter((document: { component?: string }) => document.component);
test.describe.configure({ timeout: 60000 });
async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled({ timeout: 30000 });
}
async function openSearch(page: Page) {
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('gallery navigation without Fetch Metadata returns HTML', async ({ request }) => {
  // Browsers omit Sec-Fetch-Dest on non-localhost HTTP origins, including the LAN preview.
  for (const path of ['/components', '/components?platform=react&q=검색&category=inputs']) {
    const response = await request.get(path, { headers: { Accept: 'text/html' } });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/html');
    expect(await response.text()).toContain('<h1>전체 컴포넌트</h1>');
  }
});

test('gallery refresh requests return React payloads', async ({ request }) => {
  for (const fetchMetadata of [{}, { 'Sec-Fetch-Dest': 'empty' }]) {
    const response = await request.get('/components?platform=react&_rsc', {
      headers: { Accept: 'text/x-component', RSC: '1', ...fetchMetadata },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/x-component');
    expect(await response.text()).toContain('"id":"components"');
  }
});

test('gallery covers all public components with packed thumbnails and a shared support link', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await visit(page, '/components');
  await expect(page.locator('[data-component-card]')).toHaveCount(components.length);
  await expect(page.getByRole('heading', { level: 1, name: '전체 컴포넌트' })).toBeVisible();
  await expect(page.locator('.page-toc')).toHaveCount(0);
  expect(await page.locator('[data-component-card]').evaluateAll(cards => cards.map(card => card.getAttribute('href'))))
    .toEqual(components.map((document: { path: string }) => document.path + '?platform=vue2'));
  for (let offset = 0; offset < components.length; offset += 8) {
    const responses = await Promise.all(components.slice(offset, offset + 8).map(async (document: { thumbnail: string }) =>
      [document.thumbnail, (await request.get(document.thumbnail)).status()]));
    for (const [path, status] of responses) expect(status, path).toBe(200);
  }
  await expect(page.locator('.gallery-note a')).toHaveAttribute('href', '/catalog?platform=vue2');
  await expect(page.locator('.gallery-card .platform-status, .gallery-card .device-status')).toHaveCount(0);
  await expect(page.locator('[data-component-card="DsTabPane"]')).toContainText('Tabs의 구성 요소');
  const manifest = await (await request.get('/previews/thumbnails/manifest.json')).json();
  expect(manifest.renderer).toBe('@kjun-ui/react');
  expect(Object.keys(manifest.images)).toHaveLength(components.length);
  expect(errors).toEqual([]);
});

test('gallery search and category persist through reload and history, and empty results can reset', async ({ page }) => {
  await visit(page, '/components?q=검색&category=inputs');
  const input = page.getByRole('textbox', { name: '컴포넌트 검색어', exact: true });
  await expect(input).toHaveValue('검색');
  const filters = page.locator('.gallery-filters');
  await expect(filters.getByRole('button', { name: /Inputs/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-component-card="DsSearchInput"]')).toBeVisible();
  await filters.getByRole('button', { name: /Finance/ }).click();
  await expect(page).toHaveURL(/category=finance/);
  await page.goBack();
  await expect(filters.getByRole('button', { name: /Inputs/ })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled({ timeout: 30000 });
  await expect(input).toHaveValue('검색');
  await input.fill('없는검색어987654');
  await expect(page.locator('[data-component-card]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '일치하는 컴포넌트가 없습니다' })).toBeVisible();
  await page.getByRole('button', { name: '전체 컴포넌트 보기', exact: true }).click();
  await expect(page).toHaveURL(/\/components\?platform=vue2$/);
  await expect(page.locator('[data-component-card]')).toHaveCount(components.length);
  await input.pressSequentially('loadOptions');
  await expect(page.locator('[data-component-card]')).toHaveCount(1);
  await expect(page.locator('[data-component-card="DsSearchInput"]')).toBeVisible();
});

test('global search finds synonyms, purpose, internal service aliases and API anchors', async ({ page }) => {
  await visit(page, '/components');
  const dialog = await openSearch(page);
  const input = dialog.getByRole('combobox');
  for (const [query, title] of [['알림', '피드백 서비스'], ['검색', 'Combobox'], ['저장 폼', 'FormGroup'], ['Toast', '피드백 서비스']]) {
    await input.fill(query);
    await expect(dialog.getByRole('option').filter({ has: page.getByText(title, { exact: true }) })).toBeVisible();
  }
  await input.fill('loadOptions');
  await expect(dialog.getByRole('option').first()).toContainText('SearchInput');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/components\/search-input\?platform=vue2#api$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('#api')).toBeInViewport();
});

test('search shortcut, keyboard navigation, focus return and Korean composition work', async ({ page }) => {
  await visit(page, '/components');
  const trigger = page.getByRole('button', { name: '문서 검색', exact: true });
  await expect(trigger).toBeEnabled();
  await trigger.focus();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
  const input = dialog.getByRole('combobox');
  await expect(input).toBeFocused();
  await input.fill('검색');
  await input.press('ArrowDown');
  await expect(dialog.locator('[role="option"][aria-selected="true"]')).toHaveCount(1);
  await input.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  const galleryInput = page.getByRole('textbox', { name: '컴포넌트 검색어', exact: true });
  await galleryInput.focus();
  await page.keyboard.press('Meta+k');
  await expect(input).toBeFocused();
  await input.press('Escape');
  await expect(galleryInput).toBeFocused();
  await trigger.click();
  await input.fill('queryKey');
  await input.dispatchEvent('compositionstart');
  await input.press('Enter');
  await expect(dialog).toBeVisible();
  await input.dispatchEvent('compositionend');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/components\/data-state\?platform=vue2#api$/);
});

test('category and child navigation preserve URLs, open the current ancestors and survive navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await visit(page, '/components/accordion-item');
  const nav = page.getByRole('navigation', { name: '문서 탐색', exact: true });
  await expect(nav.getByRole('button', { name: 'Layout 분류', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('button', { name: 'Accordion 하위 구성', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: 'AccordionItem', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.breadcrumbs')).toContainText('Layout');
  await expect(page.locator('.page-navigation a').first()).toHaveAttribute('href', '/components/accordion?platform=vue2');
  await nav.getByRole('button', { name: 'Inputs 분류', exact: true }).click();
  await nav.getByRole('link', { name: 'Input', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/input\?platform=vue2$/);
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled({ timeout: 30000 });
  await expect(nav.getByRole('button', { name: 'Layout 분류', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await nav.getByRole('button', { name: 'Actions 분류', exact: true }).click();
  await nav.getByRole('button', { name: 'Dropdown 하위 구성', exact: true }).click();
  await nav.getByRole('link', { name: 'DropdownDivider', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/dropdown-divider\?platform=vue2$/);
  expect(errors).toEqual([]);
});

test('mobile discovery has no overflow and image failures keep the document reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/previews/thumbnails/input.png', route => route.abort());
  await visit(page, '/components?q=DsInput');
  const card = page.locator('[data-component-card="DsInput"]');
  await expect(card).toContainText('미리보기를 불러오지 못했습니다');
  await card.click();
  await expect(page).toHaveURL(/\/components\/input\?platform=vue2$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Input', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: '탐색 메뉴', exact: true }).click();
  const nav = page.getByRole('navigation', { name: '문서 탐색', exact: true });
  await nav.getByRole('link', { name: 'Select', exact: true }).click();
  await expect(page).toHaveURL(/\/components\/select\?platform=vue2$/);
  await expect(nav).not.toBeVisible();
  await openSearch(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
});

test('gallery columns follow available width without horizontal overflow', async ({ page }) => {
  await visit(page, '/components');
  const layouts = [];
  for (const width of [1440, 1200, 900, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const available = await page.locator('.component-gallery').evaluate(el => el.clientWidth);
    const columns = available >= 1000 ? 3 : available >= 660 ? 2 : 1;
    layouts.push({ viewport: width, available, columns });
    await expect(page.locator('.gallery-grid')).toHaveCSS('grid-template-columns', new RegExp(`^(\\d+(\\.\\d+)?px\\s*){${columns}}$`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.gallery-thumbnail img').evaluateAll(images => Promise.all(images.map(img => { (img as HTMLImageElement).loading = 'eager'; return (img as HTMLImageElement).decode(); })));
    await page.screenshot({ path: `artifacts/discovery-${width}.png` });
    await page.locator('[data-component-card]').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `artifacts/thumbnail-review/gallery-${width}.png` });
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  writeFileSync('artifacts/thumbnail-review/gallery-layouts.json', JSON.stringify(layouts, null, 2) + '\n');
});


test('gallery column boundaries use the container even inside a wide viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1800, height: 1000 });
  await visit(page, '/components?platform=react');
  for (const [width, columns] of [[659, 1], [660, 2], [999, 2], [1000, 3]]) {
    await page.locator('.component-gallery').evaluate((el, width) => { (el as HTMLElement).style.width = width + 'px'; }, width);
    await expect.poll(() => page.locator('.gallery-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(columns);
  }
  await page.locator('.component-gallery').evaluate(el => { (el as HTMLElement).style.removeProperty('width'); });
  await expect(page.locator('.gallery-note')).toContainText('대표 이미지는 형태를 알아보기 쉽게 확대했습니다. 실제 크기는 상세 예제에서 확인하세요.');
  const button = page.locator('[data-component-card="DsButton"]');
  await button.focus(); await page.keyboard.press('Tab');
  await expect(page.locator('[data-component-card="DsButtonGroup"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-component-card="DsChip"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/components\/chip\?platform=react$/);
});
