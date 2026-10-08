import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { cardDesignExamples } from '../../../shared/card-examples';
import { presetConfig } from '../../../shared/example-registry';
// @ts-ignore Compiles copied examples against installed tarballs.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';
// @ts-ignore Local packed preview server.
import { servePreviews } from '../../../scripts/guide-capture.mjs';
let server: { url: string; close: () => Promise<void> };
test.beforeAll(async () => { server = await servePreviews(); });
test.afterAll(async () => { await server.close(); });

test('Card documentation exposes compositions and copies the current surface contract', async ({ page }) => {
  await page.goto('/components/card?platform=react');
  await expect(page.getByRole('link', { name: '디자인', exact: true })).toHaveAttribute('href', '#card-designs');
  await expect(page.locator('#card-designs [data-guide-case]')).toHaveCount(cardDesignExamples.length);
  const example = page.locator('#card-designs [data-guide-case="card-actions"]');
  await example.scrollIntoViewIfNeeded();
  await expect(example.locator('.guide-running')).toHaveAttribute('data-ready', 'true');
  await example.frameLocator('iframe').getByRole('button', { name: '상세 보기' }).click();
  await expect(example.frameLocator('iframe').getByText('프로젝트 상세를 확인했습니다.', { exact: true })).toBeVisible();
  await expect(example.locator('.code-block')).toHaveCount(0);
  await expect(example.getByRole('button', { name: '코드 복사', exact: true })).toHaveCount(0);
  await expect(page.locator('#api')).toContainText('bodyPadding');
});

for (const platform of ['vue2','react','native'] as const) for (const mode of ['full','usage']) {
  test(`${platform} Card ${mode}: all compositions run from copied code`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const entries: Record<string, string> = {};
    for (const example of cardDesignExamples) {
      const config = presetConfig('DsCard', example.id);
      entries[example.id + '-' + mode] = await prepareExample(platform, 'DsCard', example.id + '-' + mode, config.settings, config.values, 'default', undefined, mode);
    }
    await compileEntries(platform, entries);
    await page.route('**/previews/export-checks/**', async route => {
      const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
      await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
    });
    for (const example of cardDesignExamples) {
      await page.setViewportSize({ width: example.viewportWidth || 800, height: 1000 });
      await page.goto(`${server.url}/previews/export-checks/${platform}/${example.id}-${mode}.html`);
      if (example.id === 'card-form') {
        await page.getByRole('textbox', { name: /프로젝트 이름/ }).fill('새 프로젝트');
        await page.getByRole('button', { name: '변경 사항 저장' }).click();
        await expect(page.getByText('새 프로젝트 저장했습니다.', { exact: true })).toBeVisible();
      } else if (example.id === 'card-table') {
        await expect(page.getByText('서비스 소개서', { exact: true })).toBeVisible();
        await page.getByRole('button', { name: '전체 문서 보기' }).click();
        await expect(page.getByText('전체 문서를 확인했습니다.', { exact: true })).toBeVisible();
      } else if (example.id === 'card-statistic') await expect(page.getByText('128', { exact: true })).toBeVisible();
      else {
        if (example.id === 'card-media') await expect(page.getByRole('img', { name: '정리된 문서와 작업 보드를 그린 일러스트' })).toBeVisible();
        const label = example.id === 'card-media' ? '가이드 보기' : ['card-actions','card-custom-header'].includes(example.id) ? '상세 보기' : '프로젝트 보기';
        await page.getByRole('button', { name: label, exact: true }).click();
        await expect(page.getByText('프로젝트 상세를 확인했습니다.', { exact: true })).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
