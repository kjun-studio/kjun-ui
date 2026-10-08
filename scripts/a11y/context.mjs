import { expect } from './assert.mjs';
import { openFixture } from '../../tests/browser/packed-fixture.ts';
export const controlsSelector = 'button,input:not([type="hidden"]),textarea,select,a[href],[role="link"],[role="button"],[role="menuitem"],[role="checkbox"],[role="switch"],[role="radio"],[role="tab"],[role="slider"],[role="combobox"]';
export const controls = page => page.locator(controlsSelector).and(page.locator(':not([aria-hidden="true"]):not([aria-hidden="true"] *)')).filter({ visible: true });
export const snapshot = page => page.evaluate(() => window.__a11ySnapshot?.values || {});
export async function configure(page, settings) {
  await page.evaluate(settings => {
    window.postMessage({ type: 'kjun:catalog-configure', config: { settings: { ...window.__a11ySnapshot.settings, ...settings } } }, location.origin);
  }, settings);
  await expect.poll(() => page.evaluate(settings => Object.entries(settings).every(([key, value]) => window.__a11ySnapshot?.settings[key] === value), settings)).toBe(true);
}
export async function openCase(page, definition) {
  await page.addInitScript(() => {
    window.__a11ySnapshot = null;
    window.__a11yEvents = [];
    window.addEventListener('message', event => {
      if (event.source !== window || event.origin !== location.origin) return;
      if (event.data.type === 'kjun:catalog-snapshot') window.__a11ySnapshot = event.data;
      if (event.data.type === 'kjun:catalog-event') window.__a11yEvents.push(event.data.event);
    });
  });
  const custom = definition.profile === 'field' || definition.profile === 'boundary';
  await openFixture(page, definition.platform, '?component=' + definition.component,
    custom ? 'a11y' : 'catalog', 'production', true);
  // Packed Native Web startup can exceed the interaction assertion window in
  // Docker. Wait for its actual ready snapshot; keep behavior assertions strict.
  if (custom) await expect(definition.profile === 'boundary' ? page.getByText('예제 렌더 오류', { exact: true }) : page.locator('[data-field="0"]')).toBeVisible({ timeout: 15000 });
  else await expect.poll(() => page.evaluate(() => !!window.__a11ySnapshot), { timeout: 15000 }).toBe(true);
}
export async function tabTo(page, target) {
  for (let index = 0; index < 45; index++) {
    if (await target.evaluate(el => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(target, 'Tab 순서에서 대상에 도달해야 합니다').toBeFocused();
}
export function primary(page, d) {
  if (d.scenario.button) return page.getByRole('button', { name: d.scenario.button, exact: true }).first();
  if (d.profile === 'field') return page.locator('[data-field="0"]').locator('input,textarea').first();
  if (d.profile === 'radio') return page.getByRole('radio').first();
  if (d.profile === 'tabs') return page.getByRole('tab').first();
  if (d.profile === 'checked') return page.getByRole(d.scenario.role).first();
  if (d.profile === 'slider') return page.getByRole('slider').first();
  if (d.profile === 'link') return page.getByRole('link').first().or(page.getByRole('button', { name: '외부 페이지', exact: true })).first();
  return controls(page).first();
}
export async function idReferences(page) {
  const defects = await page.evaluate(() => {
    const ids = new Map();
    for (const element of document.querySelectorAll('[id]')) ids.set(element.id, (ids.get(element.id) || 0) + 1);
    const defects = [...ids].filter(([, count]) => count > 1).map(([id, count]) => `중복 ID ${id}: ${count}`);
    for (const element of document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls],[aria-activedescendant],label[for]')) {
      for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-activedescendant', 'for']) {
        if (attr === 'aria-controls' && (element.getAttribute('aria-expanded') === 'false' || element.getAttribute('aria-selected') === 'false')) continue;
        for (const id of (element.getAttribute(attr) || '').split(/\s+/).filter(Boolean))
          if (ids.get(id) !== 1) defects.push(`${element.tagName} ${attr}=${id}: 연결 대상 ${ids.get(id) || 0}개`);
      }
    }
    return defects;
  });
  expect(defects, 'ID 참조 및 중복 ID').toEqual([]);
}
export async function namedControls(page) {
  const list = controls(page);
  expect(await list.count(), '검사할 실제 컨트롤이 있어야 합니다').toBeGreaterThan(0);
  for (const control of await list.all()) await expect(control).toHaveAccessibleName(/\S/);
  await idReferences(page);
}
export async function openLayer(page, d, key = 'Enter') {
  const trigger = primary(page, d);
  await tabTo(page, trigger);
  await page.keyboard.press(key);
  const layer = page.getByRole((d.profile === 'menu' || d.profile === 'divider') && d.platform !== 'native' ? 'menu' : 'dialog').last();
  await expect(layer).toBeVisible();
  return { trigger, layer };
}
export async function stateChanged(page, before) {
  await expect.poll(async () => JSON.stringify(await snapshot(page)), { message: '키보드 실행 결과가 소비자 상태에 반영되어야 합니다' }).not.toBe(JSON.stringify(before));
}
