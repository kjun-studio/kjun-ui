import { test, expect } from '@playwright/test';

for (const width of [1440, 390]) test(`${width}px: verification records stay searchable outside the reading navigation`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/catalog?platform=react');
  const searchTrigger = page.getByRole('button', { name: '문서 검색', exact: true });
  await expect(searchTrigger).toBeEnabled();
  if (width < 768) await page.getByRole('button', { name: '탐색 메뉴', exact: true }).click();
  const nav = page.getByRole('navigation', { name: '문서 탐색', exact: true });
  await expect(nav.getByRole('link', { name: '전체 지원 현황', exact: true })).toBeVisible();
  await expect(nav.locator('a[href^="/verification"]')).toHaveCount(0);
  if (width < 768) await page.keyboard.press('Escape');

  await expect(page.locator('.page-navigation a').last()).toHaveAttribute('href', '/tokens?platform=react');
  await page.locator('.page-navigation a').last().click();
  await expect(page).toHaveURL(/\/tokens\?platform=react$/);
  await expect(page.locator('.page-navigation a').first()).toHaveAttribute('href', '/catalog?platform=react');

  for (const query of ['검증 기록', '검증 근거']) {
    await searchTrigger.click();
    const dialog = page.getByRole('dialog', { name: '문서 검색', exact: true });
    const input = dialog.getByRole('combobox');
    await input.fill(query);
    const result = dialog.getByRole('option').filter({ has: page.locator('.search-result-title strong', { hasText: /^검증 기록$/ }) });
    await expect(result).toHaveCount(1);
    await input.press('Enter');
    await expect(page).toHaveURL(/\/verification\?platform=react$/);
    await expect(page.getByRole('heading', { level: 1, name: '검증 기록', exact: true })).toBeVisible();
    await expect(page.locator('.page-navigation')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '대상', exact: true })).toBeEnabled();
  }
});
