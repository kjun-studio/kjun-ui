import { test, expect, type Page, type Locator } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureRadio(next), next);
const radio = (page: Page, name = '사과') => page.getByRole('radio', { name, exact: true });
const control = (item: Locator, platform: string) => platform === 'native' ? item.locator(':scope > div').first() : item.locator('xpath=ancestor::label[1]').locator('.kjun-choice-control');
async function geometry(item: Locator, platform: string) {
  return item.evaluate((el, platform) => {
    const wrapper = platform === 'native' ? el : el.closest('label')!;
    const circle = platform === 'native' ? wrapper.firstElementChild! : wrapper.querySelector('.kjun-choice-control')!;
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
    return { brand: role('brand'), hover: role('brand-hover'), active: role('brand-active'), border: role('border-strong'), disabled: role('text-disabled'), surface: role('surface'), danger: role('danger') };
  });
}
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: radio proportions and label spacing stay stable through selection in both palettes`, async ({ page }) => {
    for (const palette of ['', '?palette=dark']) {
      await openFixture(page, platform, palette, 'radio-design');
      const before = await geometry(radio(page), platform);
      // Radio shares Checkbox's 24px control so mixed choice lists line up; the dot keeps the same proportion.
      expect(before.circle.width).toBe(24); expect(before.circle.height).toBe(24); expect(before.border).toBe('2px');
      expect(before.dot!.width).toBe(10); expect(before.dot!.height).toBe(10);
      expect(before.dot!.x + 5).toBeCloseTo(before.circle.x + 12);
      expect(before.dot!.y + 5).toBeCloseTo(before.circle.y + 12);
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
      expect((await geometry(standalone, platform)).dot!.width).toBe(10);
      const checkbox = page.getByRole('checkbox', { name: '체크박스' });
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
      // Disabled is drawn by the disabled-text role on every part, not by fading the row.
      await expect(circle).toHaveCSS('border-top-color', colors.disabled);
      expect((await geometry(item, platform)).opacity).toBe('1');
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
    // Every platform rings the control, not the whole label row.
    const focus = control(last, platform);
    await expect(focus).toHaveCSS('outline-style', 'solid'); await expect(focus).toHaveCSS('outline-width', '2px');
    if (platform === 'native') await expect(last).not.toHaveCSS('outline-style', 'solid');
    await expect(page.getByRole('radiogroup', { name: '과일' })).toHaveCSS('gap', '16px');
    await configure(page, { direction: 'vertical', width: 180 });
    await expect(page.getByRole('radiogroup', { name: '과일' })).toHaveCSS('gap', '8px');
    const a = await geometry(first, platform), b = await geometry(radio(page, '배'), platform);
    expect(a.circle.x).toBe(b.circle.x);
    expect(b.wrapper.y - a.wrapper.y - a.wrapper.height).toBe(8);
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: a RadioGroup and a Checkbox in FormGroups take the group's name, hint and error`, async ({ page }) => {
    await openFixture(page, platform, '', 'radio-design');
    const colors = await roles(page);
    const group = page.getByRole('radiogroup', { name: '배송 방법' });
    await expect(group).toHaveAccessibleDescription('도착일이 달라집니다.');
    const normal = radio(page, '일반 배송'), fast = radio(page, '빠른 배송'), agree = page.getByRole('checkbox', { name: '마케팅 수신' });
    // Supporting text under the label describes each control.
    await expect(normal).toHaveAccessibleDescription('2~3일 · 무료');
    await expect(agree).toHaveAccessibleDescription('이벤트 소식을 받습니다');
    await configure(page, { error: true });
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(group).toHaveAccessibleDescription('배송 방법을 골라 주세요.');
    await expect(agree).toHaveAttribute('aria-invalid', 'true');
    // Boxes still to be chosen take the danger boundary; a chosen one keeps the brand.
    await page.mouse.move(0, 0);
    await expect(control(normal, platform)).toHaveCSS('border-top-color', colors.danger);
    await expect(control(agree, platform)).toHaveCSS('border-top-color', colors.danger);
    await page.getByText('빠른 배송', { exact: true }).click();
    await expect(fast).toBeChecked(); await page.mouse.move(0, 0);
    await expect(control(fast, platform)).toHaveCSS('border-top-color', colors.brand);
    await expect(control(normal, platform)).toHaveCSS('border-top-color', colors.danger);
  });

  test(`${platform}: RadioGroup size and disabled reach every radio`, async ({ page }) => {
    await openFixture(page, platform, '', 'radio-design');
    const fast = radio(page, '빠른 배송');
    await page.getByText('빠른 배송', { exact: true }).click(); await expect(fast).toBeChecked();
    for (const [size, ring, dot] of [['sm', 20, 8], ['md', 24, 10], ['lg', 28, 12]] as const) {
      await configure(page, { size });
      const g = await geometry(fast, platform);
      expect([g.circle.width, g.dot!.width, g.gap]).toEqual([ring, dot, 8]);
      expect(g.dot!.x + dot / 2).toBeCloseTo(g.circle.x + ring / 2);
    }
    await configure(page, { groupDisabled: true });
    await expect(fast).toBeDisabled(); await expect(radio(page, '일반 배송')).toBeDisabled();
    await page.getByText('일반 배송', { exact: true }).click({ force: true });
    await expect(fast).toBeChecked();
  });

  test(`${platform}: the chosen radio and a checked box submit their own values`, async ({ page }) => {
    test.skip(platform === 'native', 'Native has no forms; name is Web only');
    await openFixture(page, platform, '', 'radio-design');
    const data = () => page.getByTestId('form').evaluate(form => [...new FormData(form as HTMLFormElement)].map(([k, v]) => k + '=' + v).join('&'));
    expect(await data()).toBe('');
    await page.getByText('빠른 배송', { exact: true }).click();
    await page.getByText('마케팅 수신', { exact: true }).click();
    await expect(page.getByRole('checkbox', { name: '마케팅 수신' })).toBeChecked();
    expect(await data()).toBe('shipping=fast&agree=yes');
  });
}
