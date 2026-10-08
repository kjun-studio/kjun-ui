import { demoPalettes } from '../../../shared/demo-colors';
const roleColor = (palette: string, role: 'inputBorderFocus' | 'danger') => {
  const hex = demoPalettes[palette as keyof typeof demoPalettes][role];
  return `rgb(${[1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16)).join(', ')})`;
};
import { test, expect, type Page } from '@playwright/test';
import { presetConfig } from '../../../shared/example-registry';

async function visit(page: Page, platform: string, component: string, palette = 'default') {
  await page.goto(`/previews/catalog-${platform}.html?component=${component}`);
  await expect(page.locator(`[data-component="${component}"]`)).toBeVisible();
  await page.evaluate(({ palette, config }) => {
    (window as any).inputDocsRevision = false;
    window.addEventListener('message', event => {
      if (event.data?.type === 'kjun:catalog-snapshot' && event.data.revision === 10) (window as any).inputDocsRevision = true;
    });
    window.postMessage({ type: 'kjun:catalog-configure', config: { ...config, palette, revision: 10, reset: 10 } }, location.origin);
  }, { palette, config: presetConfig(component) });
  await expect.poll(() => page.evaluate(() => (window as any).inputDocsRevision)).toBe(true);
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: packed basic input examples render purpose, surface and bounded width`, async ({ page }) => {
    for (const component of ['DsInput', 'DsTextarea', 'DsSelect', 'DsCombobox', 'DsSearchInput', 'DsDatePicker', 'DsTimePicker', 'DsQuantityStepper']) {
      await visit(page, platform, component);
      const control = page.locator('.catalog-render').locator('input, textarea, button, [role="button"]').first();
      await expect(control).toBeVisible();
      expect((await control.boundingBox())!.width).toBeLessThanOrEqual(360);
      if (component === 'DsInput') await expect(control).toHaveAccessibleName('목록 이름');
      if (component === 'DsSelect') {
        await expect(control).toHaveAccessibleName('공개 범위');
        await control.click();
        await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '나만 보기', exact: true })).toBeVisible();
      }
    }
  });

  test(`${platform}: settings forms and search toolbars fit desktop and 375px palettes`, async ({ page }) => {
    test.setTimeout(180000);
    for (const width of [375, 1280]) for (const palette of ['default', 'violet', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await visit(page, platform, 'GuideSettingsForm', palette);
      const input = page.getByRole('textbox', { name: /목록 이름/ });
      const save = page.getByRole('button', { name: '변경 사항 저장', exact: true });
      await expect(input).toHaveCSS('height', '48px');
      await expect(save).toHaveCSS('height', '48px');
      await input.fill('장기 보유 자산');
      await expect(input).toHaveCSS('border-top-color', roleColor(palette, 'inputBorderFocus'));
      await page.screenshot({ path: `artifacts/input-design-20260920/settings-${platform}-${palette}-${width}-focus.png`, fullPage: true });
      await input.fill('');
      await save.click();
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(input).toHaveCSS('border-top-color', roleColor(palette, 'danger'));
      await expect(page.getByText('목록 이름을 입력해 주세요.', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `artifacts/input-design-20260920/settings-${platform}-${palette}-${width}-error.png`, fullPage: true });
      await visit(page, platform, 'GuideSearchToolbar', palette);
      await expect(page.locator('input').first()).toHaveCSS('height', '32px');
      await expect(page.getByRole('button', { name: '필터 초기화', exact: true })).toHaveCSS('height', '32px');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `artifacts/input-design-20260920/toolbar-${platform}-${palette}-${width}.png`, fullPage: true });
    }
  });
}
