import { test, expect } from '@playwright/test';
import { open, configure, events, reset } from './adoption-fixture';

test('vue3 Table retains row identity through cells, expansion and selection', async ({ page }) => {
  await open(page, 'table');
  await expect(page.getByText('Cell 7', { exact: true })).toBeVisible();
  await page.locator('tbody').getByRole('button').click();
  await expect(page.getByText('Expand 7', { exact: true })).toBeVisible();
  await page.locator('tbody').getByRole('checkbox').check();
  await expect(page.getByRole('group', { name: '선택 작업' })).toContainText('Selected 7');
});
