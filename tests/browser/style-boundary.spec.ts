import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const props = ['display', 'box-sizing', 'margin-top', 'margin-bottom', 'padding-top', 'padding-left',
  'list-style-type', 'color', 'text-decoration-line', 'font-size', 'font-weight', 'background-color',
  'border-top-width', 'border-top-style', 'border-top-left-radius', 'border-collapse'];

async function probes(page: Page, testId: string) {
  return page.locator(`[data-testid="${testId}"]`).evaluate((root, names) =>
    [...root.querySelectorAll('[data-probe]')].map(el => {
      const style = getComputedStyle(el);
      return [el.getAttribute('data-probe'), Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)]))];
    }), props);
}

async function kjunElements(page: Page) {
  // Modal content is portaled; read every kjun element on the page, in document order.
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.evaluate(names => [...document.querySelectorAll('[data-testid="kjun"] *, [role="dialog"], [role="dialog"] *')]
    .map(el => { const style = getComputedStyle(el); return names.map(name => style.getPropertyValue(name)).join('|'); }), props);
}

for (const platform of ['react', 'vue2']) {
  test(`${platform}: app markup inside KjunProvider keeps the app's own styles`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '', 'style-boundary');
    expect(await probes(page, 'inside')).toEqual(await probes(page, 'outside'));
  });

  test(`${platform}: app CSS does not change kjun component styles`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await openFixture(page, platform, '?noapp', 'style-boundary');
    const without = await kjunElements(page);
    await openFixture(page, platform, '', 'style-boundary');
    expect(await kjunElements(page)).toEqual(without);
  });
}
