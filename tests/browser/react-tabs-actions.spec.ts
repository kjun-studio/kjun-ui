import { test, expect } from '@playwright/test';
import { openFixture } from './packed-fixture';

for (const nested of [false, true]) {
  test(`react: Tabs actions keep Select and Dropdown collections separate (nested=${nested})`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openFixture(page, 'react', '?mode=tabs' + (nested ? '&nested' : ''), 'adoption-controls', 'development');
    const tablist = page.getByRole('tablist', { name: '작업 탭' });
    await expect(tablist.getByRole('tab')).toHaveCount(2);
    const select = page.getByRole('button', { name: '작업 필터' });
    await select.click();
    await page.getByRole('option', { name: 'two', exact: true }).click();
    await expect(page.getByTestId('selection')).toHaveText('two');
    await expect(page.locator('[role="listbox"]')).toHaveCount(0);
    await expect(select).toBeFocused();
    await select.press('Enter');
    await expect(page.getByRole('option', { name: 'two', exact: true })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="listbox"]')).toHaveCount(0);
    await expect(select).toBeFocused();
    await tablist.getByRole('tab', { name: '첫 탭' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tablist.getByRole('tab', { name: '둘째 탭' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('둘째 내용', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '작업 메뉴' }).click();
    await page.getByRole('menuitem', { name: '실행' }).click();
    await expect(page.getByTestId('menu-count')).toHaveText('1');
    await page.getByRole('button', { name: '도구 모음 전환' }).click();
    await expect(page.getByTestId('actions')).toHaveCount(0);
    await page.getByRole('button', { name: '도구 모음 전환' }).click();
    await select.click();
    await expect(page.getByRole('option')).toHaveCount(2);
    await expect(tablist.getByRole('tab')).toHaveCount(2);
    expect(errors).toEqual([]);
  });
}
