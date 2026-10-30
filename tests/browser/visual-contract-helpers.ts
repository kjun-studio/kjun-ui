import { expect, type Locator, type Page } from '@playwright/test';
import { presetConfig } from '../../shared/example-registry';
import { openFixture } from './packed-fixture';
export const box = async (node:Locator) => (await node.boundingBox())!;
export const chartPart = (page:Page, name:string) => page.getByTestId('chart').locator(`[data-kjun-chart-part="${name}"]`);
export const chartRoot = (page:Page) => page.getByTestId('chart').locator('[data-kjun-chart-kind]');
export const middle = (r:{y:number;height:number}) => r.y + r.height/2;

export const open = (page: any, platform: string, query = '') => openFixture(page, platform, query, 'visual-reaudit');
export async function openSelect(page: any) {
  const trigger = page.getByTestId('select').locator('button').first();
  // Vue dismisses on page scroll. Finish the runner's auto-scroll before opening the menu.
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await trigger.click();
}
export const geometry = (node: Locator) => node.evaluate(root => {
  const table = root.querySelector('table');
  const title = [...root.querySelectorAll('*')].find(el => el.textContent === '자산' && !el.children.length)!;
  const header = table ? table.querySelector('thead tr')! : title.parentElement!.parentElement!;
  const body = table ? [...table.querySelectorAll('tbody tr')] : [...header.parentElement!.children].slice(1);
  const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x - header.getBoundingClientRect().x, width: r.width, height: r.height }; };
  return { header: rect(header), columns: [...header.children].map(rect), rows: body.slice(0, 2).map(rect) };
});
export const sameGeometry = (a: Awaited<ReturnType<typeof geometry>>, b: Awaited<ReturnType<typeof geometry>>) => {
  expect(a.columns.length).toBe(b.columns.length);
  for (const [index, col] of a.columns.entries()) {
    expect(Math.abs(col.width - b.columns[index].width)).toBeLessThanOrEqual(1);
    expect(Math.abs(col.x - b.columns[index].x)).toBeLessThanOrEqual(1);
  }
  expect(Math.abs(a.header.height - b.header.height)).toBeLessThanOrEqual(1);
  for (const [index, row] of a.rows.entries()) expect(Math.abs(row.height - b.rows[index].height)).toBeLessThanOrEqual(1);
};

export const output = 'artifacts/visual-refinement-20260928';
export async function configure(page: Page, name: string, settings: object = {}, values: object = {}, palette = 'default') {
  const defaults = presetConfig(name);
  const revision = await page.evaluate(() => ((window as any).visualRevision = ((window as any).visualRevision || 0) + 1));
  await page.evaluate(config => window.postMessage({ type: 'kjun:catalog-configure', config }, location.origin), {
    settings: { ...defaults.settings, ...settings }, values, palette, revision, reset: revision,
  });
  await expect.poll(() => page.evaluate(() => (window as any).visualSnapshot?.revision)).toBe(revision);
}
export async function visit(page: Page, platform: string, name: string) {
  await page.addInitScript(() => window.addEventListener('message', event => {
    if (event.data?.type === 'kjun:catalog-snapshot') (window as any).visualSnapshot = event.data;
  }));
  await openFixture(page, platform, `?component=${name}`, 'catalog');
  await expect.poll(() => page.evaluate(() => !!(window as any).visualSnapshot)).toBe(true);
  await page.evaluate(() => document.fonts.ready);
}
export const state = (page: Page) => page.evaluate(() => (window as any).visualSnapshot.values);
export const timePart = (page: Page, platform: string, name: string) => page.getByRole('button', { name: `알림 시각 ${name}`, exact: true });
export const option = (page: Page, platform: string, name: string) => page.getByRole(platform === 'native' ? 'radio' : 'option', { name, exact: true });
