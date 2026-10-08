import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureSlider(next), next);
const valueOf = (page: Page, id = 'single', index = 0) => page.getByTestId(id).getByRole('slider').nth(index).evaluate((el: any) => Number(el.getAttribute('aria-valuenow') ?? el.value));
async function appearance(page: Page, platform: string, id = 'single') {
  return page.getByTestId(id).evaluate((wrapper, platform) => {
    const root = wrapper.firstElementChild!;
    const sliders = [...root.querySelectorAll('input[type=range], [role=slider]')];
    const track = platform === 'native' ? sliders[0].parentElement! : root.querySelector('.kjun-slider-track')!;
    const rail = platform === 'native' ? track.firstElementChild!.firstElementChild! : track.querySelector('.kjun-slider-rail')!;
    const fill = platform === 'native' ? track.children[1] : track.querySelector('.kjun-slider-fill')!;
    const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const thumbs = sliders.map((slider: any) => {
      const el = platform === 'react' ? slider.closest('.kjun-slider-thumb') : platform === 'native' ? slider.firstElementChild : slider;
      // Chromium returns the input's own style for vendor range pseudo-elements.
      // Resolve the matching thumb rules on a detached-from-layout probe instead.
      let probe: HTMLElement | undefined;
      if (platform === 'vue2') {
        probe = document.createElement('span');
        for (const sheet of [...document.styleSheets]) for (const rule of [...sheet.cssRules]) {
          if (!(rule instanceof CSSStyleRule)) continue;
          if (!rule.selectorText.split(',').some(selector => selector.includes('::-webkit-slider-thumb') && slider.matches(selector.trim().replace('::-webkit-slider-thumb', '')))) continue;
          // Keep variable-bearing shorthands intact; expanded border longhands
          // have empty values until their custom properties are resolved.
          probe.style.cssText += rule.style.cssText;
        }
        probe.style.position = 'fixed'; probe.style.left = '-10000px'; probe.style.display = 'block';
        slider.parentElement.appendChild(probe);
      }
      const style = getComputedStyle(probe || el);
      let box = rect(el);
      if (platform === 'vue2') {
        const width = parseFloat(style.width), span = Number(slider.max) - Number(slider.min);
        const fraction = span > 0 ? (Number(slider.value) - Number(slider.min)) / span : 0;
        box = { x: box.x + (box.width - width) * fraction, y: box.y + (box.height - width) / 2, width, height: parseFloat(style.height) };
      }
      const result = { ...box, border: style.borderTopWidth, color: style.borderTopColor, background: style.backgroundColor, shadow: style.boxShadow, outline: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset };
      probe?.remove();
      return result;
    });
    const caption = root.firstElementChild!;
    const label = caption.children.length > 1 ? caption.firstElementChild! : null;
    const output = caption.lastElementChild!, type = getComputedStyle(output);
    return { root: rect(root), rail: rect(rail), fill: rect(fill), track: rect(track), thumbs,
      label: label ? rect(label) : null, output: rect(output), fontSize: type.fontSize, fontWeight: type.fontWeight,
      numeric: type.fontVariantNumeric, opacity: getComputedStyle(root).opacity };
  }, platform);
}

for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: slider fills meet thumb centers at both ends and collapsed ranges`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    for (const value of [0, 40, 100]) {
      await configure(page, { value });
      await expect.poll(() => valueOf(page)).toBe(value);
      const a = await appearance(page, platform), thumb = a.thumbs[0];
      expect(a.rail.height).toBe(6);
      expect(a.track.height).toBe(44);
      expect(a.rail.x - a.root.x).toBeCloseTo(10);
      expect(a.root.width - a.rail.width).toBeCloseTo(20);
      expect(thumb.width).toBe(20); expect(thumb.height).toBe(20); expect(thumb.border).toBe('2px');
      expect(thumb.shadow).toBe('none');
      expect(a.fill.x + a.fill.width).toBeCloseTo(thumb.x + thumb.width / 2, 0);
      expect(a.rail.y + a.rail.height / 2).toBeCloseTo(thumb.y + thumb.height / 2, 0);
    }
    for (const range of [[0, 100], [20, 80], [50, 50]]) {
      await configure(page, { range });
      await expect.poll(() => valueOf(page, 'range')).toBe(range[0]);
      const a = await appearance(page, platform, 'range');
      expect(a.fill.x).toBeCloseTo(a.thumbs[0].x + 10, 0);
      expect(a.fill.x + a.fill.width).toBeCloseTo(a.thumbs[1].x + 10, 0);
      if (range[0] === range[1]) expect(a.fill.width).toBe(0);
    }
    await configure(page, { min: 0, max: 1, step: .3, value: .9, range: [.3, .9] });
    await expect.poll(() => valueOf(page)).toBe(.9);
    const end = await appearance(page, platform);
    expect(end.fill.width).toBeCloseTo(end.rail.width, 0);
    expect(end.thumbs[0].x + 10).toBeCloseTo(end.rail.x + end.rail.width, 0);
  });

  test(`${platform}: slider colors stay flat through hover, drag, focus and disabled`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    await page.mouse.move(0, 0);
    const normal = (await appearance(page, platform)).thumbs[0];
    const center = { x: normal.x + 10, y: normal.y + 10 };
    await page.mouse.move(center.x, center.y);
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].color).not.toBe(normal.color);
    const hover = (await appearance(page, platform)).thumbs[0];
    await page.mouse.down();
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].color).not.toBe(hover.color);
    const pressed = (await appearance(page, platform)).thumbs[0];
    expect(pressed.background).toBe(normal.background); expect(pressed.shadow).toBe('none'); expect(pressed.width).toBe(20);
    await page.mouse.move(center.x + 40, center.y); await page.mouse.up();
    await expect.poll(() => valueOf(page)).toBeGreaterThan(40);
    await expect(page.getByTestId('events')).toContainText('commit:');
    await page.mouse.move(0, 0);
    // Leave pointer focus, then return with the keyboard to require the thumb ring.
    await page.getByTestId('single').getByRole('slider').press('Tab');
    await page.keyboard.press('Shift+Tab');
    const focus = (await appearance(page, platform)).thumbs[0];
    expect(focus.outline).toBe('solid'); expect(focus.outlineWidth).toBe('2px'); expect(focus.outlineOffset).toBe('3px');
    await configure(page, { disabled: true, value: 40 });
    await expect.poll(async () => (await appearance(page, platform)).opacity).toBe('0.5');
    await page.mouse.move(center.x, center.y); await page.mouse.down();
    const disabled = (await appearance(page, platform)).thumbs[0];
    expect(disabled.color).toBe(normal.color);
    await page.mouse.move(center.x + 80, center.y); await page.mouse.up();
    expect(await valueOf(page)).toBe(40);
    await expect(page.getByTestId('events')).toBeEmpty();
  });

  test(`${platform}: labels wrap and values remain aligned in narrow and dark layouts`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 740 });
    for (const query of ['', '?palette=dark']) {
      await openFixture(page, platform, query, 'slider-design');
      await configure(page, { width: 220, label: '길이가 긴 알림 음량 설정의 설명을 여러 줄로 표시합니다' });
      await expect.poll(async () => (await appearance(page, platform)).label!.height).toBeGreaterThan(20);
      const a = await appearance(page, platform);
      expect(a.label!.x + a.label!.width).toBeLessThanOrEqual(a.output.x - 11);
      expect(a.output.x + a.output.width).toBeCloseTo(a.root.x + a.root.width, 0);
      expect(a.fontSize).toBe('14px'); expect(a.fontWeight).toBe('600'); expect(a.numeric).toContain('tabular-nums');
      await configure(page, { label: '' });
      await expect.poll(async () => (await appearance(page, platform)).label).toBeNull();
      const noLabel = await appearance(page, platform);
      expect(noLabel.output.x + noLabel.output.width).toBeCloseTo(noLabel.root.x + noLabel.root.width, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });

  test(`${platform}: range track clicks and keyboard changes retain ordered handles and commit once`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    const range = page.getByTestId('range'), first = range.getByRole('slider').nth(0), last = range.getByRole('slider').nth(1);
    const a = await appearance(page, platform, 'range');
    await page.mouse.click(a.rail.x + a.rail.width * .9, a.rail.y + 3);
    await expect.poll(() => valueOf(page, 'range', 1)).toBe(90);
    await expect(page.getByTestId('events')).toHaveText('change:[20,90]|commit:[20,90]');
    await first.focus(); await first.press('End');
    await expect.poll(() => valueOf(page, 'range')).toBe(90);
    await first.press('Home'); await first.press('PageUp'); await first.press('PageDown'); await first.press('ArrowRight');
    await expect.poll(() => valueOf(page, 'range')).toBe(1);
    await first.press('Tab'); await expect(last).toBeFocused();
    await last.press('Home');
    await expect.poll(() => valueOf(page, 'range', 1)).toBe(1);
  });
}
