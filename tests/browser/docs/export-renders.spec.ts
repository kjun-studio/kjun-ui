import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { exampleNames } from '../../../shared/example-registry';
// @ts-ignore Packed example verification helpers.
import { usageTools } from '../../../scripts/usage-tools.mjs';
import { usageScenarios } from '../../../shared/visual-guides/usage-content';
import { exportsRoute } from './export-checks';

const guides = JSON.parse(readFileSync('apps/docs/lib/generated/visual-guides.json', 'utf8'));
type Check = (page: Page, id: string) => Promise<void>;
const rendered: Check = async (page, id) => {
  await expect.poll(() => page.locator('[data-component], [data-testid]').count(), { message: id }).toBeGreaterThan(0);
};
// Usage code runs with only the common setup, so no unregistered DS-* element may remain.
const usageRendered = (platform: string): Check => async (page, id) => {
  const root = page.locator(platform === 'vue2' ? 'body > .kjun-scope' : '#root > *');
  await expect(root, id).toBeVisible();
  await expect.poll(() => root.evaluate(root => root.querySelectorAll('*').length), { message: id }).toBeGreaterThan(0);
  expect(await root.evaluate(root => [...root.querySelectorAll('*')].some(node => node.tagName.startsWith('DS-'))), id).toBe(false);
};

for (const platform of ['vue2', 'react', 'native'] as const) {
  test(`${platform} every copied example, usage and visual guide export renders without runtime errors`, async ({ context }) => {
    test.setTimeout(600000);
    const cases: { id: string; check: Check }[] = [
      ...exampleNames.map(name => ({ id: name + '-default', check: rendered })),
      ...usageTools.usageNames.map((name: string) => ({
        id: `usage-${name}-${usageTools.implementationExamples[name] ? 'implementation' : 'default'}`, check: usageRendered(platform),
      })),
      ...Object.values(guides).flatMap((guide: any) => [...guide.platforms[platform].states, ...guide.platforms[platform].sizes]
        .map((item: { id: string }) => ({ id: `${guide.name}-guide-${item.id}`, check: rendered }))),
      ...usageScenarios.map(({ name, scenario }) => ({ id: `${name}-usage-${scenario.id}`, check: rendered })),
    ];
    const pages = await Promise.all(Array.from({ length: 4 }, () => context.newPage()));
    let cursor = 0;
    await Promise.all(pages.map(async page => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await exportsRoute(page);
      while (cursor < cases.length) {
        const { id, check } = cases[cursor++];
        await page.goto(`/previews/export-checks/${platform}/${id}.html`);
        await check(page, id);
        expect(errors, id).toEqual([]);
      }
      await page.close();
    }));
  });
}
