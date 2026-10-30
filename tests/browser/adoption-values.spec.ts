import { test, expect } from '@playwright/test';
import { open, configure, events, reset } from './adoption-fixture';

test('vue3 KpiRow distinguishes loading, missing, invalid and zero without formatting missing data', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page, 'values');
  const item = (label: string) => page.locator('.kjun-kpi-row__item').filter({ has: page.locator('.kjun-kpi-row__label', { hasText: label }) });
  await configure(page, { loading: true });
  await expect(item('Loading')).toHaveAttribute('data-state', 'loading');
  await expect(item('Loading').locator('.kjun-skeleton')).toBeVisible();
  for (const name of ['Missing', 'Invalid']) {
    await expect(item(name)).toHaveAttribute('data-state', 'missing');
    await expect(item(name).locator('.kjun-kpi-row__value')).toHaveText('—');
    await expect(item(name).locator('.kjun-kpi-row__value')).toHaveCSS('color', 'rgb(11, 23, 35)');
  }
  await expect(item('Zero').locator('.kjun-kpi-row__value')).toHaveText('0');
  await expect(item('Zero').locator('.kjun-kpi-row__badge')).toHaveText('0');
  await expect(item('Loading').locator('.kjun-kpi-row__badge')).toHaveCount(0);
  await configure(page, { loading: false, value: 0 });
  await expect(item('Loading')).toHaveAttribute('data-state', 'missing');
  await expect(item('Missing').locator('.kjun-kpi-row__value')).toHaveText('$0%');
  expect(errors).toEqual([]);
});

for (const shape of ['bar', 'circle']) test(`vue3 ${shape} Progress keeps missing and indeterminate distinct from 0%`, async ({ page }) => {
  await open(page, 'values');
  const section = page.getByTestId(shape), progress = section.locator('.kjun-progress').first();
  await expect(progress).toHaveAttribute('data-state', 'missing');
  await expect(progress.getByRole('progressbar')).toHaveCount(0);
  await expect(progress.getByRole('img')).toHaveAccessibleName(/Progress:/);
  await expect(section.getByRole('progressbar', { name: 'Default zero', exact: true })).toHaveAttribute('aria-valuenow', '0');
  await configure(page, { value: 0 });
  await expect(progress.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  await configure(page, { value: 50 });
  await expect(progress.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  await configure(page, { value: null, indeterminate: true });
  await expect(progress).toHaveAttribute('data-state', 'indeterminate');
  await expect(progress.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
  await expect(progress.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
  await expect(progress).not.toContainText('0%');
  await configure(page, { indeterminate: false });
  await expect(progress).toHaveAttribute('data-state', 'missing');
  await configure(page, { value: 30, max: 0 });
  await expect(progress).toHaveAttribute('data-state', 'missing');
  await expect(progress.getByRole('progressbar')).toHaveCount(0);
});

test('vue3 unknown Progress respects reduced motion without displaying a numeric value', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'values');
  await configure(page, { indeterminate: true });
  const bar = page.getByTestId('bar').locator('.kjun-progress').first();
  await expect(bar.locator('.kjun-progress-track > div')).toHaveCSS('animation-name', 'none');
  await expect(bar).not.toContainText('%');
});

