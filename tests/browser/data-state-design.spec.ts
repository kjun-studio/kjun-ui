import { captureReview } from './review-captures';
import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
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
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: DataState refresh pill floats over content and retains it, focus and scroll`, async ({ page }) => {
    await openFixture(page, platform, '', 'data-state-design');
    const region = page.getByTestId('region'), input = page.getByRole('textbox', { name: 'Retained input' });
    await input.fill('edited'); await input.focus();
    await page.getByTestId('scroll').evaluate(el => { el.scrollTop = 40; (window as any).retainedNode = el; });
    await update(page, { width: 200 });
    const restingTitle = await box(region.getByText('Result title'));
    for (const loading of [true, false, true]) {
      await update(page, { loading, width: 200, refreshingText: '최신 문서와 세부 정보를 업데이트하고 있습니다' });
      await expect(input).toBeFocused(); await expect(input).toHaveValue('edited');
      expect(await page.getByTestId('scroll').evaluate(el => el === (window as any).retainedNode && el.scrollTop === 40)).toBe(true);
      if (loading) {
        const status = region.getByText('최신 문서와 세부 정보를 업데이트하고 있습니다', { exact: true });
        const statusBox = await box(status), title = await box(region.getByText('Result title'));
        // The pill floats over the content's top, so the content does not move while it refreshes.
        expect(title.y).toBe(restingTitle.y);
        // The pill (the text's parent, beside its spinner) sits centred.
        const r = await box(region), pill = await box(status.locator('..'));
        expect(Math.abs(Math.round(pill.x + pill.width / 2 - (r.x + r.width / 2)))).toBeLessThanOrEqual(1);
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
      // Every state keeps the size's minimum height, so switching between them does not jump.
      const height = (content: number) => Math.max(tokens.extensions.state.minimumHeights[size], 2 * padding + content);
      // A small state draws the small empty, like the boundary's fallback.
      const e = tokens.extensions.empty, sm = size === 'sm';
      const title = sm ? 20 : 24, icon = sm ? e.smIconSize + e.smIconGap : e.iconSize + e.iconGap, actionGap = sm ? e.smActionGap : e.actionGap;
      await update(page, { empty: true, emptyText: 'Empty title', size });
      expect((await box(region)).height).toBe(height(title));
      await expect(region.getByText('Empty title', { exact: true })).toHaveCSS('font-size', `${sm ? e.smTitleSize : e.titleSize}px`);
      await update(page, { customEmpty: true });
      expect((await box(region)).height).toBe(height(48));
      await update(page, { customEmpty: false, emptyIcon: 'search', emptyActionText: 'Create' });
      // Icon and its gap, the title, the action gap and the 40px button.
      expect((await box(region)).height).toBe(height(icon + title + actionGap + 40));
      // The description sits under the title in the description type.
      await update(page, { emptyDescription: 'Empty description' });
      const description = region.getByText('Empty description', { exact: true });
      await expect(description).toHaveCSS('font-size', `${e.descriptionSize}px`);
      expect(Math.round((await box(description)).y - (await box(region.getByText('Empty title', { exact: true }))).y)).toBe(title + e.descriptionGap);
      await update(page, { empty: false, emptyIcon: '', emptyActionText: '', emptyDescription: undefined, loading: true, resultKey: null, loadingText: 'Loading' });
      expect((await box(region)).height).toBe(height(56));
      const text = region.getByText('Loading', { exact: true }), spinner = region.locator('svg').first();
      // The loading ring is decorative (the block's status carries the text), so it is found by its drawing.
      // It turns, so its bounding box grows mid-turn; its centre does not.
      const ring = await box(spinner), ringBottom = ring.y + ring.height / 2 + tokens.extensions.spinner.sizes.md / 2;
      expect(Math.round((await box(text)).y - ringBottom)).toBe(12);
      await expect(text).toHaveCSS('text-align', 'center');
      await update(page, { loading: false, resultKey: 'a' });
    }
    await update(page, { size: 'md', loading: true, resultKey: null, loadingPadding: 'none' });
    expect((await box(region)).height).toBe(56);
    await update(page, { customLoading: true });
    expect((await box(region)).height).toBe(64);
    for (const related of ['KjunMarketTable', 'KjunMarketCards', 'KjunMarketSimpleList']) {
      await update(page, { related, loading: false, empty: true, resultKey: 'a' });
      const title = await box(region.getByText('Empty title', { exact: true }));
      const desc = await box(region.getByText('Empty description', { exact: true }));
      // Shared KjunEmpty contributes no second 32px padding inside DataState; the message sits centred in the minimum height.
      const r = await box(region);
      expect(r.y + r.height - desc.y - desc.height).toBeGreaterThanOrEqual(48);
      expect(desc.y - title.y - title.height).toBe(tokens.extensions.empty.descriptionGap);
      // Market lists sit in dense surfaces, so their empty state uses size sm.
      await expect(region.getByText('Empty title', { exact: true })).toHaveCSS('font-size', `${tokens.extensions.empty.smTitleSize}px`);
      await captureReview(region, { path: `artifacts/data-state-visual-fix/related-${platform}-${related}-empty.png` });
    }
    for (const related of ['KjunTable', 'KjunMarketTable', 'KjunMarketCards', 'KjunMarketSimpleList']) {
      await update(page, { related, loading: false, empty: false });
      const resting = await box(region.getByText('Result row', { exact: true }));
      await update(page, { loading: true });
      await expect(region.getByText('갱신 중...', { exact: true })).toBeVisible();
      // Related lists keep their rows in place while the pill floats over them.
      expect((await box(region.getByText('Result row', { exact: true }))).y).toBe(resting.y);
    }
    // Like retry, the empty action appears only when the app handles it.
    await update(page, { related: '', loading: false, empty: true, emptyActionText: 'Create' });
    await expect(region.getByRole('button', { name: 'Create' })).toBeVisible();
    await update(page, { noEmptyHandler: true });
    await expect(region.getByRole('button', { name: 'Create' })).toHaveCount(0);
    // A skeleton has no visible words, so its live region carries the loading text (Native names it).
    await update(page, { empty: false, noEmptyHandler: false, loading: true, resultKey: null, skeleton: true, loadingText: 'Loading' });
    if (platform === 'native') await expect(region.getByRole('status', { name: 'Loading' })).toBeAttached();
    else await expect(region.getByRole('status').filter({ hasText: 'Loading' })).toHaveCount(1);
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
    // The blocking error shares the boundary's Empty form: the description sits one Empty description gap under the title.
    expect(Math.round(desc.y - title.y - title.height)).toBe(tokens.extensions.empty.descriptionGap);
    await expect(region.getByRole('alert')).toContainText('Connection failed');
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
