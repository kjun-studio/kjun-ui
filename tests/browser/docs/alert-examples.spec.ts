import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { exampleDefinition, presetConfig } from '../../../shared/example-registry';
// @ts-ignore Compiles copied examples against the independent packed consumer.
import { prepareExample, compileEntries } from '../../../scripts/example-consumers.mjs';
for (const platform of ['react', 'vue2', 'native'] as const) for (const mode of ['full', 'usage']) {
  test(`${platform} Alert ${mode}: presets and copied code render and close`, async ({ page }) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const entries: Record<string, string> = {};
    const presets = exampleDefinition('DsAlert').presets;
    for (const preset of presets) {
      const config = presetConfig('DsAlert', preset.id), id = 'alert-' + mode + '-' + preset.id;
      entries[id] = await prepareExample(platform, 'DsAlert', id, config.settings, config.values, 'default', undefined, mode);
    }
    await compileEntries(platform, entries);
    await page.route('**/previews/export-checks/**', async route => {
      const path = new URL(route.request().url()).pathname.split('/export-checks/')[1];
      await route.fulfill({ body: await readFile('artifacts/export-checks/' + path), contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html' });
    });
    for (const preset of presets) {
      await page.goto(`/previews/export-checks/${platform}/alert-${mode}-${preset.id}.html`);
      if (preset.id === 'body') await expect(page.getByText('작업 상태를 설명하는 문장입니다.', { exact: true })).toHaveCSS('font-size', '14px');
      if (preset.id === 'retry') {
        await expect(page.getByText('네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.', { exact: true })).toBeVisible();
        await expect(page.getByText('네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.', { exact: true })).toHaveCSS('font-size', '14px');
        await page.getByRole('button', { name: '다시 시도', exact: true }).click();
        await expect(page.getByText('재시도 요청', { exact: true })).toBeVisible();
      }
      const close = page.getByRole('button', { name: /닫기/ });
      await expect(close).toHaveCSS('width', presetConfig('DsAlert', preset.id).settings.size === 'sm' ? '24px' : '28px');
      await close.press('Enter');
      await expect(page.getByText('알림 닫힘', { exact: true })).toBeVisible();
      await expect(close).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
