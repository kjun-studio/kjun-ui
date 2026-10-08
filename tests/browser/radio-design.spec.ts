import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureRadio(next), next);
const radio = (page: Page, name = '사과') => page.getByRole('radio', { name, exact: true });
const control = (item: Locator, platform: string) => platform === 'native' ? item.locator(':scope > div').first() : item.locator('..').locator('.ds-choice-control');
async function geometry(item: Locator, platform: string) {
  return item.evaluate((el, platform) => {
    const wrapper = platform === 'native' ? el : el.closest('label')!;
    const circle = platform === 'native' ? wrapper.firstElementChild! : wrapper.querySelector('.ds-choice-control')!;
    const label = wrapper.lastElementChild!;
    const rect = (node: Element) => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const c = rect(circle), l = rect(label), s = getComputedStyle(circle);
    return { circle: c, dot: circle.firstElementChild ? rect(circle.firstElementChild) : null,
      wrapper: rect(wrapper), gap: l.x - (c.x + c.width), weight: getComputedStyle(label).fontWeight,
      border: s.borderTopWidth, shadow: s.boxShadow, opacity: getComputedStyle(wrapper).opacity };
  }, platform);
}
async function roles(page: Page) {
  // Resolve the applying app's roles, rather than duplicating palette values.
  return page.evaluate(() => {
    const root = document.querySelector('.kjun-scope') || document.documentElement;
    const role = (name: string) => {
      const probe = document.createElement('span');
      probe.style.color = `var(--kjun-${name})`; root.appendChild(probe);
      const value = getComputedStyle(probe).color; probe.remove(); return value;
    };
    return { brand: role('brand'), hover: role('brand-hover'), active: role('brand-active'), border: role('border-strong'), disabledBorder: role('border-secondary'), surface: role('surface') };
  });
}
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: radio proportions and label spacing stay stable through selection in both palettes`, async ({ page }) => {
    for (const palette of ['', '?palette=dark']) {
      await openFixture(page, platform, palette, 'radio-design');
      const before = await geometry(radio(page), platform);
      expect(before.circle.width).toBe(20); expect(before.circle.height).toBe(20); expect(before.border).toBe('2px');
      expect(before.dot!.width).toBe(8); expect(before.dot!.height).toBe(8);
      expect(before.dot!.x + 4).toBeCloseTo(before.circle.x + 10);
      expect(before.dot!.y + 4).toBeCloseTo(before.circle.y + 10);
      expect(before.gap).toBe(8); expect(before.weight).toBe('500'); expect(before.shadow).toBe('none');
      // Native rows keep the 44px touch target on coarse pointers and the 32px choice row on fine ones, like Web.
      if (platform === 'native') expect(before.wrapper.height).toBeGreaterThanOrEqual(await page.evaluate(() => matchMedia('(pointer: coarse)').matches) ? 44 : 32);
      const target = radio(page, '체리'), unselected = await geometry(target, platform);
      await page.getByText('체리', { exact: true }).click();
      await expect(target).toBeChecked(); await expect(radio(page)).not.toBeChecked();
      const after = await geometry(target, platform);
      expect(after.wrapper).toEqual(unselected.wrapper); expect(after.weight).toBe(unselected.weight);
      await expect(page.getByTestId('events')).toHaveText('value:c|change:c');
      const standalone = radio(page, '개별 항목');
      await page.getByText('개별 항목', { exact: true }).click();
      await expect(standalone).toBeChecked();
      expect((await geometry(standalone, platform)).dot!.width).toBe(8);
      const checkbox = page.getByRole('checkbox');
      const check = await geometry(checkbox, platform);
      // Checkbox and Radio share the 8px label gap so mixed choice lists align their labels.
      expect(check.circle.width).toBe(24); expect(check.gap).toBe(8);
    }
  });

  test(`${platform}: radio border colors distinguish hover, press and disabled without changing the fill`, async ({ page }) => {
    await openFixture(page, platform, '', 'radio-design');
    const colors = await roles(page);
    await page.mouse.move(0, 0);
    for (const name of ['사과', '체리']) {
      const item = radio(page, name), circle = control(item, platform);
      await expect(circle).toHaveCSS('border-top-color', name === '사과' ? colors.brand : colors.border);
      const box = (await circle.boundingBox())!;
      await page.mouse.move(box.x + 10, box.y + 10);
      await expect(circle).toHaveCSS('border-top-color', colors.hover);
      await page.mouse.down();
      await expect(circle).toHaveCSS('border-top-color', colors.active);
      await expect(circle).toHaveCSS('background-color', colors.surface);
      await expect(circle).toHaveCSS('box-shadow', 'none');
      await page.mouse.move(0, 0); await page.mouse.up();
    }
    await configure(page, { disabled: true, value: 'a' });
    for (const name of ['사과', '체리']) {
      const item = radio(page, name), circle = control(item, platform);
      await expect(item).toBeDisabled();
      const box = (await circle.boundingBox())!;
      await page.mouse.move(box.x + 10, box.y + 10); await page.mouse.down();
      await expect(circle).toHaveCSS('border-top-color', name === '사과' ? colors.brand : colors.disabledBorder);
      expect((await geometry(item, platform)).opacity).toBe('0.5');
      await page.mouse.up();
    }
    await expect(radio(page)).toBeChecked(); await expect(page.getByTestId('events')).toBeEmpty();
  });

  test(`${platform}: radio keyboard selection, focus and group gaps survive the visual update`, async ({ page }) => {
    await openFixture(page, platform, '', 'radio-design');
    const first = radio(page), last = radio(page, '체리');
    await first.focus();
    await first.press('ArrowRight'); await expect(last).toBeFocused();
    await expect(last).toBeChecked(); await expect(radio(page, '배')).not.toBeChecked();
    const focus = platform === 'native' ? last : control(last, platform);
    await expect(focus).toHaveCSS('outline-style', 'solid'); await expect(focus).toHaveCSS('outline-width', '2px');
    await expect(page.getByRole('radiogroup')).toHaveCSS('gap', '16px');
    await configure(page, { direction: 'vertical', width: 180 });
    await expect(page.getByRole('radiogroup')).toHaveCSS('gap', '8px');
    const a = await geometry(first, platform), b = await geometry(radio(page, '배'), platform);
    expect(a.circle.x).toBe(b.circle.x);
    expect(b.wrapper.y - a.wrapper.y - a.wrapper.height).toBe(8);
  });
}
