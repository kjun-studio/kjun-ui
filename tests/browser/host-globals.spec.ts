import { expect, test } from '@playwright/test';
import { openFixture } from './packed-fixture';

type Record = { warnings: string[]; errors: string[]; appToast: string[]; boundary: string[]; outer: string[] };
const record = (page: import('@playwright/test').Page) => page.evaluate(() => {
  const w = window as unknown as Record;
  return { warnings: w.warnings, errors: w.errors, appToast: w.appToast, boundary: w.boundary, outer: w.outer };
});
// Ids differ per instance; compare the rendered structure and text.
const markup = (page: import('@playwright/test').Page, testId: string) => page.getByTestId(testId).evaluate(el =>
  el.innerHTML.replace(/\s(id|for|aria-[a-z]+|name)="[^"]*"/g, ''));

test('vue2: app instance helpers, toast and provide keys with KJUN\'s old names leave KJUN unchanged', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'host-globals');
  await expect(page.getByTestId('reference')).toBeVisible();
  expect(await markup(page, 'app-scope')).toEqual(await markup(page, 'reference'));
  await expect(page.getByTestId('reference')).not.toContainText('APP');
  await page.getByTestId('copy').getByRole('button').click();
  await expect(page.getByRole('status').or(page.getByRole('alert')).first()).toBeVisible();
  const result = await record(page);
  expect(result.appToast).toEqual([]);
  expect(result.warnings).toEqual([]);
});

test('vue2: the nearest KjunErrorBoundary shows its fallback, emits error and still reaches the app error handler', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'host-globals');
  await expect(page.getByTestId('boundary')).toContainText('문제가 발생했습니다');
  const result = await record(page);
  await expect(page.getByTestId('boundary')).toContainText('바깥 콘텐츠');
  expect(result.boundary).toEqual(['child failed']);
  expect(result.outer).toEqual([]);
  expect(result.errors).toEqual(['child failed']);
});

test('vue2: with no KJUN layer open, the app still receives Escape', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'host-globals');
  await expect(page.getByTestId('reference')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => (window as unknown as { escapes: number }).escapes)).toBe(1);
});

test('vue2: an app DsButton survives installing the KJUN plugin, which registers KjunButton beside it', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'host-globals');
  const host = page.getByTestId('app-button');
  await expect(host.getByRole('button', { name: 'APP-DS' })).toBeVisible();
  await expect(host.getByRole('button', { name: '저장' })).toHaveClass(/kjun-/);
  expect((await record(page)).warnings).toEqual([]);
});
