import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// Elements in the drawer that scroll vertically: the app's scroller must be the only one.
const scrollers = (page: Page) => page.getByRole('dialog', { name: '사진 고르기' }).evaluate(dialog =>
  [...dialog.querySelectorAll<HTMLElement>('*')].filter(el => /auto|scroll/.test(getComputedStyle(el).overflowY)).map(el => el.dataset.testid ?? ''));

test('native: renderScrollView puts a virtual list in the drawer body without a second scroller', async ({ page }) => {
  await openFixture(page, 'native', '?mode=list', 'drawer-scroll');
  const dialog = page.getByRole('dialog', { name: '사진 고르기' });
  await expect(dialog.getByText('사진 고르기')).toBeVisible();
  await expect(dialog.getByText('사진 1', { exact: true })).toBeVisible();
  expect(await scrollers(page)).toEqual(['app-scroller']);
  // Only the rows near the viewport are drawn, and the drawer keeps its own header, footer and height limit.
  expect(await dialog.getByText(/^사진 \d+$/).count()).toBeLessThan(300);
  await expect(dialog.getByTestId('offset')).toBeVisible();
  const list = (await dialog.getByTestId('app-scroller').boundingBox())!, view = page.viewportSize()!;
  expect(list.height).toBeLessThan(view.height);
  expect(await dialog.getByTestId('app-scroller').evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
});

test('native: renderScrollView hands the body to a ScrollView whose ref and scroll events the app uses', async ({ page }) => {
  await openFixture(page, 'native', '?mode=scroll', 'drawer-scroll');
  const dialog = page.getByRole('dialog', { name: '사진 고르기' });
  // The drawer's children arrive in the props, so they are drawn inside the app's scroller with the body padding.
  await expect(dialog.getByTestId('app-scroller').getByText('사진 1', { exact: true })).toBeVisible();
  expect(await scrollers(page)).toEqual(['app-scroller']);
  await expect(dialog.getByTestId('offset')).toHaveText('0');
  await page.evaluate(() => (window as any).scrollDrawer(480));
  await expect(dialog.getByTestId('offset')).toHaveText('480');
});
