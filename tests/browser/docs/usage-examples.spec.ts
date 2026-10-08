import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { presetConfig } from '../../../shared/example-registry';
// @ts-ignore Packed example verification helpers.
import { usageTools } from '../../../scripts/usage-tools.mjs';
const discovery = JSON.parse(await readFile('apps/docs/lib/generated/discovery.json', 'utf8'));
import { openExampleSettings } from './example-settings';
const platforms = ['vue2', 'react', 'native'] as const;
async function copy(page: Page) {
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).__copy = text; } } }));
  await page.locator('#usage').getByRole('button', { name: '기본 코드 복사', exact: true }).click();
  return page.evaluate(() => (window as any).__copy as string);
}
for (const platform of platforms) {
  test(`${platform}: input, size, presets and reset never change the default code`, async ({ page }) => {
    await page.goto('/components/input?platform=' + platform);
    const preview = page.locator('#preview .playground'), usage = page.locator('#usage');
    await expect(preview).toHaveAttribute('data-ready', 'true');
    await expect(usage.locator('pre')).toBeVisible();
    const original = await copy(page);
    expect(original).toEqual((await usageTools.usageExample({ name: 'DsInput', platform, ...presetConfig('DsInput') })).code);
    await preview.frameLocator('iframe').getByRole('textbox', { name: '목록 이름', exact: true }).fill('바뀐 입력');
    await openExampleSettings(page);
    await preview.getByRole('switch', { name: '읽기 전용', exact: true }).press('Space');
    await preview.getByRole('button', { name: '크기', exact: true }).click();
    await page.getByRole('option', { name: 'lg', exact: true }).click();
    expect(await copy(page)).toEqual(original);
    await preview.getByRole('button', { name: '프리셋', exact: true }).click();
    await page.getByRole('option', { name: '상태 비교', exact: true }).click();
    expect(await copy(page)).toEqual(original);
    await preview.getByRole('button', { name: '예제 초기화', exact: true }).click();
    expect(await copy(page)).toEqual(original);
    await expect(preview.locator('.code-block')).toHaveCount(0);
    await expect(usage.getByRole('link', { name: '공통 설정: 시작하기' })).toHaveAttribute('href', `/getting-started?platform=${platform}#connect`);
  });
}

test('every component owns exactly one basic usage section between guidelines and design', async ({ request }) => {
  test.setTimeout(180000);
  const documents = discovery.documents.filter((item: any) => item.component || item.path === '/feedback');
  expect(documents).toHaveLength(78);
  let index = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (index < documents.length) {
      const item = documents[index++];
      const response = await request.get(item.path + '?platform=react');
      expect(response.ok(), item.path).toBe(true);
      const html = await response.text();
      expect(html.match(/<section id="usage"/g), item.path).toHaveLength(1);
      const order = [...html.matchAll(/<section id="(preview|guidelines|usage|anatomy|api|accessibility)"/g)].map(match => match[1]);
      expect(order, item.path).toEqual(['preview', 'guidelines', 'usage', 'anatomy', 'api', 'accessibility']);
      expect(item.sectionGroups.find((group: any) => group.id === 'usage').sections).toContain('usage');
    }
  }));
});

test('usage failure and retry are independent from preview execution and frame failures', async ({ page }) => {
  const source = /\/previews\/usage\/controls\.js(?:\?.*)?$/;
  await page.route(source, route => route.abort());
  await page.goto('/components/button?platform=react');
  const usage = page.locator('#usage');
  await expect(usage.getByRole('alert')).toContainText('사용 코드를 불러오지 못했습니다.');
  await expect(usage.getByRole('button', { name: '기본 코드 복사' })).toHaveCount(0);
  await expect(page.locator('.playground')).toHaveAttribute('data-ready', 'true');
  const frame = page.frameLocator('.playground iframe');
  await frame.getByRole('button', { name: '계속하기', exact: true }).click();
  await expect(frame.getByText('1번 실행했습니다')).toBeVisible();
  await page.unroute(source);
  await usage.getByRole('button', { name: '코드 다시 불러오기' }).click();
  await expect(usage.locator('pre')).toContainText('useState(0)');
  await page.route('**/previews/catalog-react.html*', route => route.abort());
  await page.reload();
  await expect(usage.locator('pre')).toBeVisible();
  expect(await copy(page)).toContain('useState(0)');
});

test('delayed downloads and rapid platform changes never display or copy stale code', async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/previews\/usage\/controls\.js(?:\?.*)?$/, async route => { await wait; await route.continue(); });
  await page.goto('/components/button?platform=react');
  const usage = page.locator('#usage');
  await expect(usage.getByRole('status')).toBeVisible();
  for (const label of ['Vue 2', 'React Native', 'React', 'React Native']) {
    await page.getByRole('button', { name: '문서 플랫폼', exact: true }).click();
    await page.getByRole('option', { name: label, exact: true }).click();
    await expect(usage.locator('pre')).toHaveCount(0);
    await expect(usage.getByRole('button', { name: '기본 코드 복사' })).toHaveCount(0);
  }
  release();
  await expect(usage.locator('pre')).toContainText('@kjun-ui/native');
  expect(await copy(page)).toContain('@kjun-ui/native');
});
