import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { exampleDefinition, presetConfig } from '../../../shared/example-registry';
// @ts-ignore Compile copied code against the independent packed consumer.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';
for (const platform of ['react', 'vue2', 'native'] as const) for (const mode of ['full', 'usage']) {
  test(`${platform} DataState ${mode}: state presets and actions match copied code`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const entries: Record<string, string> = {};
    const presets = exampleDefinition('DsDataState').presets;
    for (const preset of presets) {
      const config = presetConfig('DsDataState', preset.id), id = `data-state-${mode}-${preset.id}`;
      entries[id] = await prepareExample(platform, 'DsDataState', id, config.settings, config.values, platform === 'native' && mode === 'usage' ? 'dark' : 'default', undefined, mode);
    }
    await compileEntries(platform, entries);
    await page.route('**/previews/export-checks/**', async route => {
      const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
      await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
    });
    await page.setViewportSize({ width: 320, height: 800 });
    for (const preset of presets) {
      await page.goto(`/previews/export-checks/${platform}/data-state-${mode}-${preset.id}.html`);
      await expect(page.getByRole('button', { name: '조회 완료', exact: true })).toBeVisible();
      if (preset.id === 'default' && platform === 'native') {
        const title = page.getByText('조회 결과', { exact: true });
        const body = page.getByText('이전 결과와 현재 조건을 구분합니다.', { exact: true });
        await expect(body).toHaveCSS('color', await title.evaluate(el => getComputedStyle(el).color));
        await expect(body).toHaveCSS('font-family', await title.evaluate(el => getComputedStyle(el).fontFamily));
      }
      if (preset.id === 'spinner') await expect(page.getByText('로딩 중...', { exact: true })).toHaveCSS('font-size', '14px');
      if (preset.id === 'empty-action') {
        await page.getByRole('button', { name: '조건 초기화', exact: true }).click();
        await expect(page.getByText('조건 초기화 요청', { exact: true })).toBeVisible();
      }
      if (['failure', 'long-retry'].includes(preset.id)) {
        await page.getByRole('button', { name: /다시 시도/, exact: false }).click();
        await expect(page.getByText('조회에 실패했습니다', { exact: false })).toHaveCount(0);
        await page.getByRole('button', { name: '조회 완료', exact: true }).click();
        await expect(page.getByText('조회 결과', { exact: true })).toBeVisible();
      }
      if (preset.id === 'long-refresh') {
        const text = await page.getByText('최신 문서와 세부 정보를 업데이트하고 있습니다', { exact: true }).boundingBox();
        const title = await page.getByText('조회 결과', { exact: true }).boundingBox();
        expect(text!.y + text!.height).toBeLessThan(title!.y);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
