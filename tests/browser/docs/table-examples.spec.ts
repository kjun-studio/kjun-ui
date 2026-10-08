import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { tableDesignExamples } from '../../../shared/table-examples';
import { presetConfig } from '../../../shared/example-registry';
// @ts-ignore Verification compiles copied examples against installed tarballs.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';
// @ts-ignore Local server for generated packed previews.
import { servePreviews } from '../../../scripts/guide-capture.mjs';

let server: { url: string; close: () => Promise<void> };
test.beforeAll(async () => { server = await servePreviews(); });
test.afterAll(async () => { await server.close(); });

test('Table documentation exposes the design examples and runs the selected scenario', async ({ page }) => {
  await page.goto('/components/table?platform=react');
  await expect(page.getByRole('link', { name: '디자인', exact: true })).toHaveAttribute('href', '#table-designs');
  await expect(page.locator('#table-designs [data-guide-case]')).toHaveCount(tableDesignExamples.length);
  const example = page.locator('#table-designs [data-guide-case="table-projects"]');
  await example.scrollIntoViewIfNeeded();
  await expect(example.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  const frame = example.frameLocator('iframe');
  await frame.getByRole('button', { name: '브랜드 웹사이트 보기', exact: true }).click();
  await expect(frame.getByText('브랜드 웹사이트 상세 보기', { exact: true })).toBeVisible();
  await expect(example.locator('.code-block')).toHaveCount(0);
  await expect(example.getByRole('button', { name: '코드 복사', exact: true })).toHaveCount(0);
});

for (const platform of ['vue2', 'react', 'native'] as const) {
  for (const mode of ['full', 'usage']) {
    test(`${platform} Table ${mode}: design examples render and preserve row interactions`, async ({ page }) => {
      test.setTimeout(180000);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      const entries: Record<string, string> = {};
      for (const scenario of tableDesignExamples) {
        const config = presetConfig('DsTable', scenario.id);
        const id = `${scenario.id}-${mode}`;
        entries[id] = await prepareExample(platform, 'DsTable', id, config.settings, config.values, 'default', undefined, mode);
      }
      await compileEntries(platform, entries);
      await page.route('**/previews/export-checks/**', async route => {
        const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
        await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
      });
      for (const scenario of tableDesignExamples) {
        await page.setViewportSize({ width: scenario.viewportWidth || 1000, height: 1000 });
        await page.goto(`${server.url}/previews/export-checks/${platform}/${scenario.id}-${mode}.html`);
        const text = scenario.settings?.design === '문서 목록' ? (scenario.id === 'table-sticky' ? '서비스 소개서 · 1' : '서비스 소개서')
          : scenario.settings?.design === '수치 비교' ? '온라인 스토어' : '브랜드 웹사이트';
        await expect(page.getByText(text, { exact: true })).toBeVisible();
        if (scenario.id === 'table-projects' || scenario.id === 'table-cards') {
          await expect(page.getByText('진행 중', { exact: true })).toBeVisible();
          await expect(page.getByText('72%', { exact: true })).toBeVisible();
          await page.getByRole('button', { name: '브랜드 웹사이트 보기', exact: true }).click();
          await expect(page.getByText('브랜드 웹사이트 상세 보기', { exact: true })).toBeVisible();
        }
        if (scenario.id === 'table-metrics') {
          await expect(page.getByText('32,480,000원', { exact: true })).toBeVisible();
          const column = page.getByRole(platform === 'vue2' ? 'columnheader' : 'button', { name: '매출', exact: true });
          await column.click();
          await expect(page.getByText('정렬 revenue asc', { exact: true })).toBeVisible();
          await column.click();
          await expect(page.getByText('정렬 revenue desc', { exact: true })).toBeVisible();
        }
        if (scenario.id === 'table-selection') {
          await expect(page.getByText('1개 선택', { exact: true })).toBeVisible();
          await page.getByRole('button', { name: '선택 항목 확인', exact: true }).click();
          await expect(page.getByText('브랜드 웹사이트 선택 확인', { exact: true })).toBeVisible();
          await page.getByRole('checkbox', { name: /행 선택/ }).nth(1).click();
          await expect(page.getByText('2개 선택', { exact: true })).toBeVisible();
          await page.getByRole('button', { name: '선택 해제', exact: true }).click();
          await expect(page.getByRole('button', { name: '선택 항목 확인', exact: true })).toHaveCount(0);
        }
        if (scenario.id === 'table-expansion') {
          await expect(page.getByText(/메인 화면 검토를 마쳤습니다/)).toBeVisible();
          await page.getByRole('button', { name: '행 확장', exact: true }).first().click();
          await expect(page.getByText(/메인 화면 검토를 마쳤습니다/)).toHaveCount(0);
          await page.getByRole('button', { name: '행 확장', exact: true }).nth(1).click();
          await expect(page.getByText(/문의 분류와 검색 화면/)).toBeVisible();
        }
        if (scenario.id === 'table-cards') {
          await expect(page.getByText('진행 현황', { exact: true })).toHaveCount(3);
          await expect(page.getByText('담당', { exact: true })).toHaveCount(3);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        }
      }
      expect(errors).toEqual([]);
    });
  }
}
