import { openExampleSettings } from './example-settings';
import { test, expect, type Page } from '@playwright/test';
const labels = { vue2: 'Vue 2', react: 'React', native: 'React Native' } as const;
type Platform = keyof typeof labels;
const selector = (page: Page) => page.getByRole('button', { name: '문서 플랫폼', exact: true });
async function choose(page: Page, name: string, value: string) {
  if (name !== '문서 플랫폼') await openExampleSettings(page);
  await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('option', { name: value, exact: true }).click();
}
async function selected(page: Page, platform: Platform) {
  // The dev client initializes this provider after the server HTML is visible.
  await expect(selector(page)).toContainText(labels[platform], { timeout: 30000 });
  await expect(page).toHaveURL(url => url.searchParams.get('platform') === platform);
  await expect(page.locator('.platform-notice')).toHaveCount(platform === 'native' ? 1 : 0);
}
async function ready(page: Page, platform: Platform) {
  await selected(page, platform);
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.playground iframe')).toHaveAttribute('src', new RegExp(`catalog-${platform}\\.html`));
}
async function clipboard(page: Page) {
  await page.addInitScript(() => {
    (window as any).__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copied.push(text); } } });
  });
}

for (const platform of Object.keys(labels) as Platform[]) test(`${platform}: URL selects the first frame, copied code and API together`, async ({ page }) => {
  const frames: string[] = [], errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (/\/previews\/catalog-.*\.html/.test(request.url())) frames.push(request.url()); });
  await clipboard(page);
  await page.goto(`/components/select?platform=${platform}#api`);
  await ready(page, platform);
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every(url => url.includes(`catalog-${platform}.html`))).toBe(true);
  await expect(page.locator('#api .api-platform')).toHaveText(`${labels[platform]} · @kjun-ui/${platform}`);
  await expect(page.locator('#api')).toBeInViewport();
  await expect(page.locator('#api').getByRole('heading', { name: '이벤트 · 슬롯' })).toHaveCount(platform === 'vue2' ? 1 : 0);
  if (platform === 'vue2') await expect(page.locator('#api')).toContainText('update:open');
  else await expect(page.locator('#api').getByRole('cell', { name: 'onOpenChange', exact: true })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.locator('#usage .code-block').getByRole('button', { name: '기본 코드 복사' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__copied[0])).toContain(`@kjun-ui/${platform}`);
  if (platform === 'native') await expect(page.locator('.platform-notice')).toContainText('iOS·Android 기기 검증은 수행하지 않았습니다.');
  expect(errors).toEqual([]);
});

test('tab preference, URL priority, normalization, reload and history preserve the platform', async ({ page }) => {
  await page.goto('/components/select?note=keep#api');
  await ready(page, 'vue2');
  await choose(page, '문서 플랫폼', 'React');
  await ready(page, 'react');
  await expect(page).toHaveURL(url => url.searchParams.get('note') === 'keep' && url.hash === '#api');
  await choose(page, '문서 플랫폼', 'React Native');
  await ready(page, 'native');
  await page.goBack(); await ready(page, 'react');
  await page.goForward(); await ready(page, 'native');
  await page.goto('/components/input?platform=invalid#api'); await ready(page, 'native');
  await page.reload(); await ready(page, 'native');
  await page.goto('/components/input?platform=react'); await ready(page, 'react');
  await page.goto('/components/button'); await ready(page, 'react');
  expect(await page.evaluate(() => sessionStorage.getItem('kjun-docs-platform-v1'))).toBe('react');
  await page.goto('/themes?platform=native&note=keep'); await ready(page, 'native');
  await expect(page).toHaveURL(url => url.pathname === '/styling' && url.searchParams.get('note') === 'keep');
});

test('gallery filters, document links, search anchors, feedback and installation share the selection', async ({ page }) => {
  await page.goto('/components?platform=react&q=검색&category=inputs');
  await selected(page, 'react');
  await page.locator('.gallery-filters').getByRole('button', { name: /Finance/ }).click();
  await selected(page, 'react');
  await page.getByRole('button', { name: '전체 컴포넌트 보기', exact: true }).click();
  await expect(page).toHaveURL(url => url.searchParams.size === 1 && url.searchParams.get('platform') === 'react');
  await page.locator('[data-component-card="DsSelect"]').click(); await ready(page, 'react');
  const next = page.locator('.page-navigation a').last();
  expect(new URL((await next.getAttribute('href'))!, page.url()).searchParams.get('platform')).toBe('react');
  await next.click(); await ready(page, 'react');
  await page.getByRole('navigation', { name: '문서 탐색' }).getByRole('link', { name: 'Input', exact: true }).click();
  await ready(page, 'react');
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  const search = page.getByRole('dialog', { name: '문서 검색', exact: true }).getByRole('combobox');
  await search.fill('queryKey'); await search.press('Enter');
  await expect(page).toHaveURL(url => url.pathname === '/components/data-state' && url.hash === '#api' && url.searchParams.get('platform') === 'react');
  await expect(page.locator('#api .api-platform')).toContainText('@kjun-ui/react');
  await page.goto('/feedback'); await ready(page, 'react');
  await expect(page.locator('#api .code-block')).toHaveCount(1);
  await expect(page.locator('#api .code-header')).toHaveText('React · @kjun-ui/react');
  await choose(page, '문서 플랫폼', 'Vue 2'); await ready(page, 'vue2');
  await expect(page.locator('#api .code-block')).toContainText('inject:');
  await page.goto('/getting-started'); await selected(page, 'vue2');
  await choose(page, '문서 플랫폼', 'React Native'); await selected(page, 'native');
  await expect(page.locator('.download-row')).toContainText('@kjun-ui/native');
  await expect(page.locator('#connect')).toContainText('colors={appColors}');
  await expect(page.locator('#connect')).toContainText('Example.jsx');
  for (const href of await page.locator('.download-row a').evaluateAll(links => links.map(link => link.getAttribute('href')))) expect(href).not.toContain('?');
  await page.goto('/'); await selected(page, 'native');
  await page.goto('/styling'); await ready(page, 'native');
});

test('independent tabs keep separate preferences, while a shared URL restores its platform', async ({ page, context }) => {
  await page.goto('/components/select?platform=react'); await ready(page, 'react');
  const other = await context.newPage();
  await other.goto('/components/select'); await ready(other, 'vue2');
  await choose(other, '문서 플랫폼', 'React Native'); await ready(other, 'native');
  await selected(page, 'react');
  await other.goto(page.url()); await ready(other, 'react');
  await other.close();
});

test('storage denial still permits selection, links and reload from the URL', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw Error('Storage disabled'); };
    Storage.prototype.setItem = () => { throw Error('Storage disabled'); };
  });
  await page.goto('/components/select?platform=unknown'); await ready(page, 'vue2');
  await choose(page, '문서 플랫폼', 'React'); await ready(page, 'react');
  await page.reload(); await ready(page, 'react');
  await page.locator('.page-navigation a').last().click(); await ready(page, 'react');
});

test('platform switches reset the selected preset, preserve palette while basic code follows the platform', async ({ page }) => {
  await clipboard(page);
  await page.goto('/components/form-group?platform=vue2'); await ready(page, 'vue2');
  await choose(page, '프리셋', '검증 오류');
  await choose(page, '색상 예제', '보라색 예제');
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await page.frameLocator('.playground iframe').getByRole('textbox', { name: '내용', exact: true }).fill('전환 전 입력');
  await page.locator('#usage .code-block').getByRole('button', { name: '기본 코드 복사' }).click();
  expect(await page.evaluate(() => (window as any).__copied[0])).toContain('@kjun-ui/vue2');
  await choose(page, '문서 플랫폼', 'React'); await ready(page, 'react');
  await expect(page.getByRole('button', { name: '프리셋', exact: true })).toContainText('검증 오류');
  await expect(page.getByRole('button', { name: '색상 예제', exact: true })).toContainText('보라색 예제');
  await expect(page.frameLocator('.playground iframe').getByRole('textbox', { name: '내용', exact: true })).toHaveValue('');
  await expect(page.locator('.example-events summary')).toHaveText('이벤트 기록 (0)');
  await expect(page.locator('#usage .code-block')).not.toContainText('전환 전 입력');
  await page.evaluate(() => { (window as any).__copied = []; });
  await page.locator('#usage .code-block').getByRole('button', { name: '기본 코드 복사' }).click();
  await expect.poll(() => page.evaluate(() => (window as any).__copied[0])).toContain('@kjun-ui/react');
});

test('rapid changes ignore an old delayed frame and keep basic code usable while the new frame loads', async ({ page }) => {
  await page.goto('/components/select?platform=vue2'); await ready(page, 'vue2');
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/previews/catalog-react.html*', async route => { await gate; await route.continue().catch(() => {}); });
  await choose(page, '문서 플랫폼', 'React');
  await selected(page, 'react');
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'false');
  await expect(page.locator('#api .api-platform')).toContainText('@kjun-ui/react');
  await expect(page.locator('#usage .code-block').getByRole('button', { name: '기본 코드 복사' })).toBeEnabled();
  await choose(page, '문서 플랫폼', 'React Native');
  release(); await ready(page, 'native');
  await expect(page.locator('#api .api-platform')).toContainText('@kjun-ui/native');
  await expect(page.locator('#usage .code-block')).toContainText('@kjun-ui/native');
});

for (const width of [320, 390]) test(`${width}px header platform selection supports keyboard, search and mobile navigation`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/components/select?platform=vue2'); await ready(page, 'vue2');
  await selector(page).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('listbox')).toBeFocused();
  await page.keyboard.press('Escape'); await expect(selector(page)).toBeFocused();
  await selector(page).press('Enter'); await expect(page.getByRole('listbox')).toBeFocused(); await page.keyboard.press('r'); await page.keyboard.press('Enter');
  await selected(page, 'react');
  await page.getByRole('button', { name: '문서 검색', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '문서 검색', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '탐색 메뉴', exact: true }).click();
  const nav = page.getByRole('navigation', { name: '문서 탐색' });
  await nav.getByRole('link', { name: 'Input', exact: true }).click(); await ready(page, 'react');
  await expect(nav).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/platform-${width}.png` });
});
