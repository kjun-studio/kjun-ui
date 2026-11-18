import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
import { tokens } from '../../packages/tokens/src/index';
const update = (page: Page, options: object) => page.evaluate(options => (window as any).configureBoundary(options), options);

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: ErrorBoundary announces its fallback, resets by retry, fallback function and resetKeys`, async ({ page }) => {
    await openFixture(page, platform, '', 'error-boundary');
    const boundary = page.getByTestId('boundary'), log = page.getByTestId('log');
    // The default fallback replaces the content, so it is announced as an alert.
    const fallback = boundary.getByRole('alert');
    await expect(fallback).toContainText('문제가 발생했습니다');
    expect(Math.round((await fallback.boundingBox())!.height)).toBeGreaterThanOrEqual(tokens.extensions.state.minimumHeights.md);
    // Retry resets; the child still throws, so the fallback comes back and the content never shows.
    await update(page, { broken: false });
    await boundary.getByRole('button', { name: '다시 시도' }).click();
    await expect(boundary.getByText('Recovered')).toBeVisible();
    await expect(log).toHaveText('reset');
    // A fallback function receives the caught error and reset.
    await update(page, { broken: true, custom: true, key: 'b' });
    const custom = boundary.getByRole('button', { name: 'Custom child failed' });
    await expect(custom).toBeVisible();
    await update(page, { broken: false });
    await custom.click();
    await expect(boundary.getByText('Recovered')).toBeVisible();
    await expect(log).toHaveText('reset,reset');
    // A changed reset key resets a failed boundary; the same key leaves it failed.
    await update(page, { broken: true, custom: false, key: 'c' });
    await expect(fallback).toBeVisible();
    await update(page, { broken: false });
    await expect(fallback).toBeVisible();
    await update(page, { key: 'd' });
    await expect(boundary.getByText('Recovered')).toBeVisible();
    await expect(log).toHaveText('reset,reset,reset');
  });
}

test('vue3: ErrorBoundary passes event handler errors on, like React', async ({ page }) => {
  await openFixture(page, 'vue3', '', 'error-boundary');
  const boundary = page.getByTestId('boundary');
  await update(page, { broken: false });
  await boundary.getByRole('button', { name: '다시 시도' }).click();
  await boundary.getByRole('button', { name: 'Throw in handler' }).click();
  // The content stays; the app's own handler receives the error.
  await expect(boundary.getByText('Recovered')).toBeVisible();
  await expect(boundary.getByRole('alert')).toHaveCount(0);
  await expect(page.getByTestId('handler-errors')).toHaveText('child failed,handler failed');
});
