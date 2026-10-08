import { test, expect, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Match HTTP access over a LAN or Tailscale, even when the test URL is localhost.
  await page.addInitScript(() => {
    Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    (window as any).__httpCopies = [];
    document.addEventListener('copy', () => {
      const field = document.activeElement;
      if (field instanceof HTMLTextAreaElement) (window as any).__httpCopies.push(field.value);
    });
  });
});

async function ready(page: Page, path: string, platform = 'vue2') {
  await page.goto(path + '?platform=' + platform);
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.usage-code-status')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '기본 코드 복사', exact: true })).toBeEnabled();
}

async function copy(page: Page, label: string) {
  await page.evaluate(() => { (window as any).__httpCopies = []; });
  const button = page.getByRole('button', { name: label, exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.focus();
  const scroll = await page.evaluate(async () => {
    for (let i = 0; i < 5; i++) await new Promise(requestAnimationFrame);
    return scrollY;
  });
  const box = await button.boundingBox();
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await expect(button.locator('..').locator('..').locator('output')).toHaveText('코드를 복사했습니다');
  await expect(button).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  const copies = await page.evaluate(() => (window as any).__httpCopies as string[]);
  expect(copies).toHaveLength(1);
  expect(await page.locator('body > textarea').count()).toBe(0);
  return copies[0];
}

for (const platform of ['vue2', 'react', 'native']) {
  test(`${platform}: HTTP getting-started setup and additions copy without secure APIs`, async ({ page }) => {
    await page.goto('/getting-started?platform=' + platform);
    const app = platform === 'vue2' ? 'App.vue' : 'App.jsx';
    const colors = platform === 'native' ? 'kjun.js' : 'kjun.css';
    expect(await copy(page, `${app} 공통 설정 복사`)).toContain('KjunProvider');
    expect(await copy(page, `${colors} 공통 설정 복사`)).toContain(platform === 'native' ? 'appColors' : '--kjun-brand');
    expect(await copy(page, '피드백 import 복사')).toContain('KjunFeedbackProvider');
    expect(await copy(page, '피드백 Provider 코드 복사')).toContain('<Example />');
    expect(await copy(page, '추가 색상 코드 복사')).toContain(platform === 'native' ? 'appDomainColors' : '--kjun-favorite');
    if (platform === 'native') expect(await copy(page, '추가 색상 속성 복사')).toBe('domainColors={appDomainColors}');
  });
  test(`${platform}: HTTP ButtonGroup code loads and copies the fixed default`, async ({ page }) => {
    await ready(page, '/components/button-group', platform);
    await expect(page.locator('#usage pre')).toBeVisible();
    await page.frameLocator('.playground iframe').getByRole('button', { name: '체리', exact: true }).click();
    const basic = await copy(page, '기본 코드 복사');
    expect(basic).toContain('DsButtonGroup');
    expect(basic).toContain('"group": "a"');
    await expect(page.locator('.usage-source > .code-block pre')).toBeVisible();
    await expect(page.locator('.usage-source > .code-block code')).toContainText('"group": "a"');
  });
}

for (const [path, name] of [
  ['/components/card', 'DsCard'], ['/components/table', 'DsTable'],
  ['/components/chip', 'DsChip'], ['/components/search-input', 'DsSearchInput'],
  ['/feedback', 'kjunFeedback'],
]) {
  test(`HTTP code loader supports ${name}`, async ({ page }) => {
    await ready(page, path);
    await expect(page.locator('.usage-source > .code-block code')).toContainText(name);
  });
}

test('HTTP category loading retries with a fresh URL and preserves state', async ({ page }) => {
  const pattern = /\/previews\/usage\/controls\.js(?:\?.*)?$/;
  const requests: string[] = [];
  await page.route(pattern, route => { requests.push(route.request().url()); return route.abort(); });
  await page.goto('/components/button-group?platform=vue2');
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.usage-code-status')).toHaveAttribute('role', 'alert');
  await page.frameLocator('.playground iframe').getByRole('button', { name: '체리', exact: true }).click();
  await page.unroute(pattern);
  await page.route(pattern, route => { requests.push(route.request().url()); return route.continue(); });
  await page.getByRole('button', { name: '코드 다시 불러오기', exact: true }).click();
  await expect(page.locator('.usage-code-status')).toHaveCount(0);
  expect(requests).toHaveLength(2);
  expect(requests[0]).not.toBe(requests[1]);
  expect(await copy(page, '기본 코드 복사')).toContain('"group": "a"');
});
