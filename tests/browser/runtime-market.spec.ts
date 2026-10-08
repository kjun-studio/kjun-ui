import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const events = (page: Page) => page.getByTestId('events');
const storage = (page: Page) => page.evaluate(() => (window as any).marketStorage());
const configure = (page: Page, next: object) => page.evaluate(value => (window as any).configureMarket(value), next);
for (const platform of ['react', 'native']) {
  const pill = (page: Page, name: string) => page.getByRole('button', { name, exact: platform === 'native' });
  const selected = async (page: Page, name: string) => expect(pill(page, name)).toHaveAttribute('aria-pressed', 'true');
  for (const stored of ['price', 'missing', '']) test(`${platform} MarketCards restores ${stored || 'default'} and emits initial sort once`, async ({ page }) => {
    await openFixture(page, platform, '?stored=' + stored, 'runtime-market');
    const key = stored === 'price' ? 'price' : 'change';
    await selected(page, key === 'price' ? 'Price' : 'Change');
    await expect(events(page)).toHaveText(JSON.stringify([key]));
    expect((await storage(page)).writes).toEqual(stored === 'missing' ? [['runtime:pill', 'change']] : []);
    await configure(page, { sortKey: key }); await expect(events(page)).toHaveText(JSON.stringify([key]));
    await pill(page, 'Volume').click(); await selected(page, 'Volume');
    await expect(events(page)).toHaveText(JSON.stringify([key]));
    expect((await storage(page)).stored['runtime:pill']).toBe('volume');
    await configure(page, { show: false }); await configure(page, { show: true });
    await selected(page, 'Volume'); await expect(events(page)).toHaveText(JSON.stringify([key]));
  });
  test(`${platform} MarketCards handles storage errors, excluded metrics and empty columns`, async ({ page }) => {
    await openFixture(page, platform, '?throw', 'runtime-market');
    await selected(page, 'Change'); await pill(page, 'Price').click(); await selected(page, 'Price');
    await expect(events(page)).toHaveText('["change","price"]');
    await configure(page, { exclude: ['price', 'change'] }); await selected(page, 'Volume');
    await configure(page, { exclude: ['price', 'change', 'volume'] });
    await expect(page.getByRole('button', { name: /Price|Change|Volume/ })).toHaveCount(0);
    await expect(events(page)).toHaveText('["change","price"]');
  });
  for (const query of ['?silent', '?sort=change']) test(`${platform} MarketCards suppresses initial sort (${query})`, async ({ page }) => {
    await openFixture(page, platform, query, 'runtime-market');
    await selected(page, 'Change'); await expect(events(page)).toHaveText('[]');
    await pill(page, 'Change').click(); await expect(events(page)).toHaveText('["change"]');
  });
}
test('React MarketCards uses localStorage by default', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('runtime:pill', 'price'));
  await openFixture(page, 'react', '?browser', 'runtime-market');
  await expect(page.getByRole('button', { name: /Price/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Change/ }).click();
  expect(await page.evaluate(() => localStorage.getItem('runtime:pill'))).toBe('change');
});
test('Native MarketCards uses only consumer-provided storage', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('runtime:pill', 'price'));
  await openFixture(page, 'native', '?browser', 'runtime-market');
  await expect(page.getByRole('button', { name: 'Change', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => localStorage.getItem('runtime:pill'))).toBe('price');
});

const compositionFixture = (page: Page, platform: string, query = '') => openFixture(page, platform, query, 'review-composition');
for (const kind of ['list', 'cards']) {
  for (const passive of [false, true]) test(`React market ${kind} preserves inner button mouse and keyboard actions (passive=${passive})`, async ({ page }) => {
    await compositionFixture(page, 'react', `?case=${kind}${passive ? '&passive' : ''}`);
    const action = page.getByRole('button', { name: 'Action', exact: true });
    await action.click(); await action.press('Enter'); await action.press('Space');
    await expect(page.getByTestId('events')).toHaveText('["action","action","action"]');
    if (!passive) {
      const row = page.locator('.kjun-market-row');
      await row.focus(); await row.press('Enter'); await row.press('Space');
      await row.locator('.kjun-market-quote').click();
      await expect(page.getByTestId('events')).toHaveText('["action","action","action","row","row","row"]');
    }
  });
}
