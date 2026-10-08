import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const platforms = ['react', 'vue2', 'native'];
const set = (page: Page, patch: object) => page.evaluate(patch => (window as any).configureTabs(patch), patch);
const tabs = [ { name: 'one', label: '첫 탭' }, { name: 'blocked', label: '비활성 탭', disabled: true }, { name: 'two', label: '둘째 탭' }, { name: 'three', label: '마지막 탭' } ];
for (const platform of platforms) {
  test(`${platform}: tab names, single entry, arrows, panel entry and instance IDs`, async ({ page }) => {
    await openFixture(page, platform, '', 'accessibility-tabs');
    const root = page.getByTestId('primary'), list = root.getByRole('tablist'), panel = root.getByRole('tabpanel');
    await expect(list).toHaveAccessibleName('탭 검사');
    await expect(list.locator('[role=tab][tabindex="0"]')).toHaveCount(1);
    await page.locator('#before').focus(); await page.keyboard.press('Tab');
    await expect(root.getByRole('tab', { name: '첫 탭' })).toBeFocused();
    for (const [key, name] of [['ArrowRight', '둘째 탭'], ['End', '마지막 탭'], ['ArrowRight', '첫 탭'], ['ArrowLeft', '마지막 탭'], ['Home', '첫 탭']]) {
      await page.keyboard.press(key); await expect(root.getByRole('tab', { name })).toBeFocused();
      await expect(root.getByRole('tab', { name })).toHaveAttribute('aria-selected', 'true');
    }
    await page.keyboard.press('Tab'); await expect(panel).toBeFocused();
    await expect(panel).toHaveAccessibleName('첫 탭');
    expect(await root.getByRole('tab', { selected: true }).getAttribute('aria-controls')).toBe(await panel.getAttribute('id'));
    const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
    expect(new Set(ids).size).toBe(ids.length);
    await set(page, { interactive: true }); await page.locator('#before').focus();
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    await expect(root.getByRole('button', { name: '패널 행동' })).toBeFocused();
  });
  test(`${platform}: controlled refusal, removal, disabled/empty and outside focus`, async ({ page }) => {
    await openFixture(page, platform, '', 'accessibility-tabs');
    const root = page.getByTestId('primary'), list = root.getByRole('tablist');
    await set(page, { refuse: true }); await root.getByRole('tab', { name: '첫 탭' }).focus();
    await page.keyboard.press('ArrowRight'); await expect(root.getByRole('tab', { name: '둘째 탭' })).toBeFocused();
    await page.keyboard.press('ArrowRight'); await expect(root.getByRole('tab', { name: '마지막 탭' })).toBeFocused();
    await expect(page.getByTestId('value')).toHaveText('one');
    await expect(page.getByTestId('events')).toHaveText('["two","three"]');
    await set(page, { value: 'two' });
    await expect(root.getByRole('tab', { name: '마지막 탭' })).toBeFocused();
    await expect(root.getByRole('tab', { name: '둘째 탭' })).toHaveAttribute('aria-selected', 'true');
    await set(page, { tabs: tabs.filter(tab => tab.name !== 'three') });
    await expect(root.getByRole('tab', { name: '둘째 탭' })).toBeFocused();
    await root.getByRole('tab', { name: '첫 탭' }).focus();
    await set(page, { tabs: tabs.map(tab => tab.name === 'one' ? { ...tab, disabled: true } : tab) });
    await expect(root.getByRole('tab', { name: '둘째 탭' })).toBeFocused();
    await set(page, { tabs: tabs.map(tab => ({ ...tab, disabled: true })) });
    await expect(list).toBeFocused(); await expect(list.locator('[role=tab][tabindex="0"]')).toHaveCount(0);
    await page.keyboard.press('Tab'); await expect(list).not.toBeFocused();
    if (await root.getByRole('tabpanel').evaluateAll(nodes => nodes.includes(document.activeElement!))) await page.keyboard.press('Tab');
    await expect(page.locator('#after')).toBeFocused();
    await set(page, { tabs: [] }); await expect(page.locator('#after')).toBeFocused();
    await expect(root.getByRole('tab')).toHaveCount(0);
    await set(page, { value: 'missing', tabs });
    await expect(page.locator('#after')).toBeFocused(); await page.locator('#before').focus(); await page.keyboard.press('Tab');
    await expect(root.getByRole('tab', { name: '첫 탭' })).toBeFocused();
    await expect(page.getByTestId('value')).toHaveText('missing');
  });
  test(`${platform}: items-only references, keyboard activation once and overflow focus ring`, async ({ page }) => {
    await openFixture(page, platform, '', 'accessibility-tabs');
    const root = page.getByTestId('primary');
    await set(page, { itemsOnly: true, refuse: true, tabs: tabs.map(tab => ({ ...tab, label: tab.label + ' · 긴 이름의 선택 항목' })) });
    await expect(root.getByRole('tabpanel')).toHaveCount(0);
    await expect(root.locator('[role=tab][aria-controls]')).toHaveCount(0);
    await page.locator('#before').focus(); await page.keyboard.press('Tab');
    await page.keyboard.press('End');
    const last = root.getByRole('tab').last(); await expect(last).toBeFocused();
    const visible = await last.evaluate(node => {
      const box = node.getBoundingClientRect(), outer = document.querySelector('[data-testid=primary]')!.getBoundingClientRect(), style = getComputedStyle(node);
      // The whole ring, inset or outside, stays within the scroller that would clip it.
      const reach = Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
      let clip = node.parentElement!;
      while (clip.parentElement && getComputedStyle(clip).overflowX === 'visible') clip = clip.parentElement;
      const area = clip.getBoundingClientRect();
      const ringInside = box.left - reach >= area.left - 0.5 && box.right + reach <= area.right + 0.5 && box.top - reach >= area.top - 0.5 && box.bottom + reach <= area.bottom + 0.5;
      return { inside: box.left >= outer.left - 1 && box.right <= outer.right + 1, ring: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0, ringInside };
    });
    expect(visible).toEqual({ inside: true, ring: true, ringInside: true });
    await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    await expect(page.getByTestId('events')).toHaveText('["three","three","three"]');
  });
}
