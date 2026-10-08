import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureDataState(options), options);
const box = async (element: Locator) => { await expect(element).toBeVisible(); return (await element.boundingBox())!; };
async function contained(region: Locator) {
  expect(await region.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  for (const button of await region.getByRole('button').all()) {
    const bounds = await box(button), parent = await box(region);
    expect(bounds.x).toBeGreaterThanOrEqual(parent.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(parent.x + parent.width + 1);
    const label = button.locator('span, div').filter({ hasText: /./ }).first();
    if (await label.count()) {
      const text = await box(label);
      expect(text.y).toBeGreaterThanOrEqual(bounds.y);
      expect(text.y + text.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
    }
  }
}
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: DataState refresh row retains content, focus and scroll`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-state-design');
    const region = page.getByTestId('region'), input = page.getByRole('textbox', { name: 'Retained input' });
    await input.fill('edited'); await input.focus();
    await page.getByTestId('scroll').evaluate(el => { el.scrollTop = 40; (window as any).retainedNode = el; });
    for (const loading of [true, false, true]) {
      await update(page, { loading, width: 200, refreshingText: '최신 문서와 세부 정보를 업데이트하고 있습니다' });
      await expect(input).toBeFocused(); await expect(input).toHaveValue('edited');
      expect(await page.getByTestId('scroll').evaluate(el => el === (window as any).retainedNode && el.scrollTop === 40)).toBe(true);
      if (loading) {
        const status = region.getByText('최신 문서와 세부 정보를 업데이트하고 있습니다', { exact: true });
        const statusBox = await box(status), title = await box(region.getByText('Result title'));
        expect(statusBox.y + statusBox.height).toBeLessThan(title.y);
        expect(await status.evaluate(el => { const r = el.getBoundingClientRect(); return document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2).some(item => item.contains(el)); })).toBe(true);
        await contained(region);
      }
    }
    await region.getByRole('button', { name: 'Export' }).click();
    await expect(page.getByTestId('events')).toHaveText('0/0/1');
    await update(page, { queryKey: 'b' });
    await expect(input).not.toBeVisible();
    await update(page, { loading: false, resultKey: 'b' });
    await expect(input).toHaveValue('edited');
    expect(await page.getByTestId('scroll').evaluate(el => el === (window as any).retainedNode && el.scrollTop === 40)).toBe(true);
  });
  test(`${platform}: DataState empty and spinner geometry, custom content and related uses`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-state-design');
    const region = page.getByTestId('region');
    for (const [size, padding] of [['sm', 24], ['md', 48], ['lg', 80]] as const) {
      await update(page, { empty: true, emptyText: 'Empty title', size });
      expect((await box(region)).height).toBe(2 * padding + 24);
      await expect(region.getByText('Empty title', { exact: true })).toHaveCSS('font-size', '16px');
      await update(page, { customEmpty: true });
      expect((await box(region)).height).toBe(2 * padding + 48);
      await update(page, { customEmpty: false, emptyIcon: 'search', emptyActionText: 'Create' });
      expect((await box(region)).height).toBe(2 * padding + 124);
      await update(page, { empty: false, emptyIcon: '', emptyActionText: '', loading: true, resultKey: null, loadingText: 'Loading' });
      expect((await box(region)).height).toBe(2 * padding + 56);
      const text = region.getByText('Loading', { exact: true }), spinner = platform === 'native' ? region.getByRole('progressbar') : region.locator('svg').first().locator('..');
      expect((await box(text)).y - ((await box(spinner)).y + 24)).toBe(12);
      await expect(text).toHaveCSS('text-align', 'center');
      await update(page, { loading: false, resultKey: 'a' });
    }
    await update(page, { size: 'md', loading: true, resultKey: null, loadingPadding: 'none' });
    expect((await box(region)).height).toBe(56);
    await update(page, { customLoading: true });
    expect((await box(region)).height).toBe(64);
    for (const related of ['DsMarketTable', 'DsMarketCards', 'DsMarketSimpleList']) {
      await update(page, { related, loading: false, empty: true, resultKey: 'a' });
      const title = await box(region.getByText('Empty title', { exact: true }));
      const desc = await box(region.getByText('Empty description', { exact: true }));
      // Shared DsEmpty contributes no second 32px padding inside DataState.
      expect((await box(region)).y + (await box(region)).height - desc.y - desc.height).toBe(48);
      expect(desc.y - title.y - title.height).toBe(8);
      await region.screenshot({ path: `artifacts/data-state-visual-fix/related-${platform}-${related}-empty.png` });
    }
    for (const related of ['DsTable', 'DsMarketTable', 'DsMarketCards', 'DsMarketSimpleList']) {
      await update(page, { related, loading: true, empty: false });
      const status = await box(region.getByText('갱신 중...', { exact: true }));
      const row = await box(region.getByText('Result row', { exact: true }));
      expect(status.y + status.height).toBeLessThan(row.y);
    }
  });
  test(`${platform}: DataState narrow actions wrap, activate once, and warnings have one gap`, async ({ page }) => {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, platform, '?palette=dark', 'data-state-design');
    const region = page.getByTestId('region'), retryText = '네트워크 연결을 확인한 후 다시 시도하기';
    await update(page, { width: 200, resultKey: null, error: 'Connection failed', retryText });
    await contained(region);
    const retry = region.getByRole('button', { name: retryText, exact: true });
    expect((await box(retry)).height).toBeGreaterThan(32);
    await retry.press('Enter'); await retry.press('Space');
    await expect(page.getByTestId('events')).toHaveText('2/0/0');
    const title = await box(region.getByText('오류 발생', { exact: true })), desc = await box(region.getByText('Connection failed', { exact: true }));
    expect(desc.y - title.y - title.height).toBe(4);
    await update(page, { resultKey: 'a' }); await contained(region);
    const card = region.getByText('Result title').locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," kjun-card ")][1]');
    const content = platform === 'native' ? region.locator(':scope > * > *').nth(1) : card;
    // Refresh warnings are polite status messages; only blocking errors use the alert role.
    const warning = platform === 'native' ? region.getByRole('status') : region.locator('.kjun-data-warning > .kjun-alert');
    const cb = await box(content), wb = await box(warning);
    expect(wb.y - cb.y - cb.height).toBe(12);
    await update(page, { error: null, empty: true, emptyActionText: retryText });
    await contained(region); await region.getByRole('button', { name: retryText }).click();
    await expect(page.getByTestId('events')).toHaveText('2/1/0');
    await update(page, { empty: false, resultKey: null, error: 'Connection failed', customError: true });
    await contained(region); await region.getByRole('button', { name: retryText }).click();
    await expect(page.getByTestId('events')).toHaveText('3/1/0');
    await page.setViewportSize({ width: 800, height: 900 });
    await page.evaluate(() => { document.body.style.zoom = '2'; });
    await contained(region);
    expect(errors).toEqual([]);
  });
}
