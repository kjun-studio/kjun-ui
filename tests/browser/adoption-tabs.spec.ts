import { test, expect } from '@playwright/test';
import { open, configure, events, reset } from './adoption-fixture';

for (const width of [320, 1000]) test(`vue3 Tabs sticky header stays in its scroll container at ${width}px and preserves tab semantics`, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  await open(page, 'tabs');
  const scroll = page.getByTestId('scroll'), header = page.locator('.kjun-tabs-header');
  await expect(page.getByRole('tab', { name: 'First', exact: true }).locator('.kjun-tab-badge')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Second 0' }).locator('.kjun-tab-badge')).toHaveText('0');
  await scroll.evaluate(element => { element.scrollTop = 100; });
  await expect.poll(async () => Math.round((await header.boundingBox())!.y - (await scroll.boundingBox())!.y)).toBe(12);
  const first = page.getByRole('tab', { name: 'First', exact: true });
  await first.focus(); await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Second 0' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel')).toHaveAccessibleName('Second 0');
  await configure(page, { sticky: false });
  await expect(header).toHaveCSS('position', 'static');
  expect(await scroll.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

