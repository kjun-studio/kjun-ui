import { test, expect, type Locator } from '@playwright/test';
import { createRequire } from 'node:module';
import { openFixture } from './packed-fixture';
const require = createRequire(import.meta.url);
const alien = require('@kjun-ui/icons/icons/alien'), rocket = require('@kjun-ui/icons/icons/rocket');
const { defaultIcons } = require('@kjun-ui/icons/defaults');
const paths = (nodes: [string, Record<string, string>][]) => nodes.map(([, attrs]) => attrs.d);
const rendered = (locator: Locator) => locator.locator('svg path').evaluateAll(nodes => nodes.map(node => node.getAttribute('d')));
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: scoped registration, variants, updates, isolation and layer inheritance`, async ({ page }) => {
    await openFixture(page, platform, '', 'icon-registry');
    for (const [id, definition] of [['extra', alien.outline], ['extra-filled', alien.filled], ['prefix', alien.outline],
      ['nested-outline', rocket.outline], ['nested-filled', alien.filled], ['nested-inherit', alien.outline],
      ['isolated', defaultIcons['help-circle'].outline], ['unknown', defaultIcons['help-circle'].outline],
      ['fallback', defaultIcons.search.outline], ['default-heart', defaultIcons.heart.filled]] as const)
      await expect.poll(() => rendered(page.getByTestId(id))).toEqual(paths(definition));
    await expect(page.getByTestId('colored-node').locator('path[fill="currentColor"]')).toHaveCSS('fill', 'rgb(182, 29, 216)');
    await page.evaluate(() => (window as any).updateIcons(true));
    for (const id of ['extra', 'prefix', 'nested-inherit']) await expect.poll(() => rendered(page.getByTestId(id))).toEqual(paths(rocket.outline));
    await expect.poll(() => rendered(page.getByTestId('isolated'))).toEqual(paths(defaultIcons['help-circle'].outline));
    for (const [button, id] of [['모달 표시', 'modal-icon'], ['드로어 표시', 'drawer-icon']]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await expect(page.getByTestId(id)).toBeVisible();
      await expect.poll(() => rendered(page.getByTestId(id))).toEqual(paths(rocket.outline));
      await page.evaluate(() => (window as any).updateIcons(false));
      await expect.poll(() => rendered(page.getByTestId(id))).toEqual(paths(alien.outline));
      await page.keyboard.press('Escape');
      await expect(page.getByTestId(id)).toBeHidden();
      await page.evaluate(() => (window as any).updateIcons(true));
    }
    await page.getByRole('button', { name: '피드백 표시', exact: true }).click();
    const toast = page.getByRole('alert').filter({ hasText: '등록된 피드백 아이콘' });
    await expect(toast).toBeVisible();
    expect(await rendered(toast)).toEqual(expect.arrayContaining(paths(alien.outline)));
    await page.evaluate(() => (window as any).updateIcons(false, true));
    await expect.poll(() => rendered(page.getByTestId('extra'))).toEqual(paths(defaultIcons['help-circle'].outline));
    await expect.poll(() => rendered(page.getByTestId('nested-filled'))).toEqual(paths(rocket.outline));
  });
}
