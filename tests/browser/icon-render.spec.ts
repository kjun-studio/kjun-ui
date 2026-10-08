import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { openFixture } from './packed-fixture';
const require = createRequire(import.meta.url);
const { allIcons } = require('@kjun/icons/all');
const cases = Object.entries(allIcons).flatMap(([name, icon]: [string, any]) => [{ name, filled: false }, ...(icon.filled ? [{ name, filled: true }] : [])]);
for (const platform of ['react', 'vue2', 'native']) test(`${platform}: all 6,220 shapes render with exact nodes and nonempty SVG geometry`, async ({ page }) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openFixture(page, platform, '', 'icon-render');
  for (let offset = 0; offset < cases.length; offset += 120) {
    if (offset) await page.evaluate(offset => (window as any).renderIconBatch(offset), offset);
    await expect(page.getByTestId('icon-batch')).toHaveAttribute('data-offset', String(offset));
    const actual = await page.locator('[data-icon]').evaluateAll(elements => elements.map(element => {
      const svg = element.querySelector('svg')!, box = svg.getBBox();
      return { name: element.getAttribute('data-icon'), filled: element.getAttribute('data-filled') === 'true',
        nodes: [...svg.querySelectorAll('path')].map(path => path.getAttribute('d')), nonempty: box.width > 0 || box.height > 0 };
    }));
    expect(actual.length).toBe(Math.min(120, cases.length - offset));
    for (const [index, result] of actual.entries()) {
      const expected = cases[offset + index];
      expect({ name: result.name, filled: result.filled }).toEqual(expected);
      expect(result.nodes, expected.name).toEqual(allIcons[expected.name][expected.filled ? 'filled' : 'outline'].map(([, attrs]: any) => attrs.d));
      expect(result.nonempty, expected.name).toBe(true);
    }
    if (!offset) await page.screenshot({ path: `artifacts/icons-review/all-shapes-${platform}.png` });
  }
  expect(errors).toEqual([]);
});
