import { test, expect, type Page } from '@playwright/test';

// Every route renders its own shell, so the sidebar mounts again on each client navigation.
const sidebar = (page: Page) => page.locator('.docs-sidebar-scroll');
async function visit(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole('button', { name: '문서 검색', exact: true })).toBeEnabled({ timeout: 30000 });
}
const inView = (page: Page, name: string) => sidebar(page).evaluate((el, name) => {
  const link = [...el.querySelectorAll('a')].find(a => a.textContent?.trim() === name)!;
  const box = el.getBoundingClientRect(), item = link.getBoundingClientRect();
  return item.top >= box.top && item.bottom <= box.bottom;
}, name);

test.beforeEach(async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); });

test('the sidebar keeps its scroll position when a link moves to another page', async ({ page }) => {
  await visit(page, '/components/input');
  const nav = page.getByRole('navigation', { name: '문서 탐색', exact: true });
  await sidebar(page).evaluate(el => { el.scrollTop = el.scrollHeight; });
  const before = await sidebar(page).evaluate(el => el.scrollTop);
  expect(before).toBeGreaterThan(100);
  const target = await nav.getByRole('link').last().textContent();
  await nav.getByRole('link').last().click();
  await expect(nav.getByRole('link', { name: target!, exact: true })).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => sidebar(page).evaluate(el => el.scrollTop)).toBeGreaterThan(before - 2);
  expect(await inView(page, target!.trim())).toBe(true);
});

test('a page opened directly scrolls its sidebar link into view', async ({ page }) => {
  await visit(page, '/components/time-picker');
  await expect(page.getByRole('navigation', { name: '문서 탐색', exact: true }).getByRole('link', { name: 'TimePicker', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => inView(page, 'TimePicker')).toBe(true);
});
