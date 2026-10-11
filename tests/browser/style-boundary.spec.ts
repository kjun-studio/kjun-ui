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

for (const platform of ['react', 'vue2']) {
  test(`${platform}: every catalog element that the reset targets sits inside kjun-owned markup`, async ({ page }) => {
    await openFixture(page, platform, '?component=all', 'catalog', 'production', true);
    // Elements kjun renders carry ds- or kjun- classes on themselves or an ancestor. Example code's own
    // markup has neither and is app markup. Every kjun-rendered element must sit inside a kjun- element.
    const orphans = await page.evaluate(() => [...document.querySelectorAll('.catalog-root *')]
      .filter(el => el.closest('[class^="ds-"], [class*=" ds-"]') && !el.closest('[class*="kjun-"]:not(.kjun-scope), .kjun-scope[class*=" kjun-"]'))
      .map(el => el.tagName.toLowerCase() + ' ' + el.outerHTML.slice(0, 100)));
    expect([...new Set(orphans)]).toEqual([]);
  });
}

for (const platform of ['react', 'vue2']) {
  test(`${platform}: a kjun component whose root is a button still takes the scope font`, async ({ page }) => {
    await openFixture(page, platform, '?noapp', 'style-boundary');
    const button = page.getByTestId('kjun').getByRole('button', { name: '저장' });
    const font = await page.locator('.kjun-scope').first().evaluate(el => getComputedStyle(el).getPropertyValue('--kjun-font').trim());
    await expect(button).toHaveCSS('font-family', font);
  });
}
