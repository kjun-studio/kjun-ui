import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

test('Vue TableCards preserves grouped columns, dynamic slots, inline actions and parent toolbar state', async ({ page }) => {
  await page.setViewportSize({ width: 641, height: 900 });
  await openFixture(page, 'vue2', '', 'runtime-cards');
  const card = page.locator('.ds-table-card');
  await expect(card).toHaveClass(/custom-row/);
  await expect(card.getByTestId('slot-Zero')).toHaveText('Zero:0:0');
  await expect(card.locator('.ds-table-card-badges')).toHaveText('Badge:0:0');
  await expect(card.getByText('Code', { exact: true })).toBeVisible();
  await expect(card.locator('.ds-table-card-body--metrics')).toHaveText(/Amount\s*10:0:0/);
  await expect(card.getByText('Blank', { exact: true })).toHaveCount(0);
  await card.getByRole('button', { name: 'Toggle', exact: true }).click();
  await card.getByRole('button', { name: 'Action', exact: true }).click();
  await expect(page.getByTestId('events')).toHaveText('["Toggle","Action"]');
  await card.getByRole('checkbox').check();
  await expect(page.getByText('Selection:0', { exact: true })).toBeVisible();
  await card.getByRole('button', { name: '상세 보기' }).click();
  await expect(page.getByText('Detail:0:0', { exact: true })).toBeVisible();
  await page.evaluate(() => (window as any).configureCards({ badge: false, inlineActions: true }));
  await expect(card.locator('.ds-table-card-subtitle')).toHaveText('Z:0:0');
  await expect(card.getByText('Code', { exact: true })).toHaveCount(0);
  await expect(card.locator('.ds-table-card-header-actions').getByRole('button', { name: 'Action' })).toBeVisible();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect(page.getByText('Selection:0', { exact: true })).toBeVisible();
  await expect(page.getByText('Detail:0:0', { exact: true })).toBeVisible();
  await expect(page.getByTestId('slot-Zero')).toHaveText('Zero:0:0');
});

test('Vue compact mode applies mobileColumns below the same boundary', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'runtime-cards');
  await page.evaluate(() => (window as any).configureCards({ responsive: 'compact' }));
  for (const width of [640, 641, 767, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.ds-table-card')).toHaveCount(0);
    await expect(page.getByRole('columnheader')).toHaveCount(width < 768 ? 4 : 9);
  }
});
