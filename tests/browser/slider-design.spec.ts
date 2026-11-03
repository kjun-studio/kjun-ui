import { open as openAdoption, configure as configureAdoption, events as adoptionEvents } from './adoption-fixture';
import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configureSlider(next), next);
const valueOf = (page: Page, id = 'single', index = 0) => page.getByTestId(id).getByRole('slider').nth(index).evaluate((el: any) => Number(el.getAttribute('aria-valuenow') ?? el.value));

test('vue3: collapsed range chooses the movable thumb for clicks and the first drag direction', async ({ page }) => {
  await openFixture(page, 'vue3', '', 'slider-design');
  const range = page.getByTestId('range');
  const box = (await range.locator('.kjun-slider-track').boundingBox())!;
  const x = (value: number) => box.x + box.width * value / 100, y = box.y + box.height / 2;
  for (const [start, end] of [[50, 70], [50, 30], [0, 20], [100, 80]]) {
    for (const drag of [false, true]) {
      await configure(page, { range: [start, start] });
      await expect.poll(() => valueOf(page, 'range')).toBe(start);
      if (drag) {
        await page.mouse.move(x(start), y); await page.mouse.down();
        await page.mouse.move(x(end), y, { steps: 5 }); await page.mouse.up();
      } else await page.mouse.click(x(end), y);
      const expected = [Math.min(start, end), Math.max(start, end)];
      await expect.poll(() => valueOf(page, 'range')).toBe(expected[0]);
      await expect.poll(() => valueOf(page, 'range', 1)).toBe(expected[1]);
      await expect(range.getByRole('slider').nth(end > start ? 1 : 0)).toBeFocused();
      const events = (await page.getByTestId('events').innerText()).split('|');
      expect(events.filter(event => event.startsWith('commit:'))).toEqual(['commit:' + JSON.stringify(expected)]);
    }
  }
  await configure(page, { range: [50, 50] });
  await page.mouse.click(x(50), y);
  await expect(page.getByTestId('events')).toBeEmpty();
  await configure(page, { range: [50, 50], disabled: true });
  await page.mouse.click(x(80), y);
  await expect(page.getByTestId('events')).toBeEmpty();
});
async function appearance(page: Page, platform: string, id = 'single') {
  return page.getByTestId(id).evaluate((wrapper, platform) => {
    const root = wrapper.firstElementChild!;
    const sliders = [...root.querySelectorAll('input[type=range], [role=slider]')];
    const track = platform === 'native' ? sliders[0].parentElement! : root.querySelector('.kjun-slider-track')!;
    const rail = platform === 'native' ? track.firstElementChild!.firstElementChild! : track.querySelector('.kjun-slider-rail')!;
    const fill = platform === 'native' ? track.children[1] : track.querySelector('.kjun-slider-fill')!;
    const rect = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    const thumbs = sliders.map((slider: any) => {
      const el = platform === 'native' ? slider.firstElementChild : slider.closest('.kjun-slider-thumb');
      const style = getComputedStyle(el);
      const box = rect(el);
      // The press halo: a box-shadow ring on the web, a circle behind the thumb on Native.
      const halo = platform === 'native' ? (slider.children[1] ? getComputedStyle(slider.children[1]).backgroundColor : 'none') : style.boxShadow;
      return { ...box, border: style.borderTopWidth, color: style.borderTopColor, background: style.backgroundColor, shadow: style.boxShadow, halo, outline: style.outlineStyle, outlineWidth: style.outlineWidth, outlineOffset: style.outlineOffset };
    });
    const caption = root.firstElementChild!;
    const label = caption.children.length > 1 ? caption.firstElementChild! : null;
    const output = caption.lastElementChild!, type = getComputedStyle(output);
    return { root: rect(root), rail: rect(rail), fill: rect(fill), track: rect(track), thumbs,
      label: label ? rect(label) : null, output: rect(output), fontSize: type.fontSize, fontWeight: type.fontWeight,
      numeric: type.fontVariantNumeric, opacity: getComputedStyle(root).opacity };
  }, platform);
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: slider fills meet thumb centers at both ends and collapsed ranges`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    for (const value of [0, 40, 100]) {
      await configure(page, { value });
      await expect.poll(() => valueOf(page)).toBe(value);
      const a = await appearance(page, platform), thumb = a.thumbs[0];
      expect(a.rail.height).toBe(6);
      expect(a.track.height).toBe(44);
      // The rail runs the caption's full width; thumbs travel inside it, so the thumb edge meets the rail end.
      expect(a.rail.x).toBeCloseTo(a.root.x, 0);
      expect(a.rail.width).toBeCloseTo(a.root.width, 0);
      expect(thumb.width).toBe(20); expect(thumb.height).toBe(20);
      // A hairline outlines the white thumb: a box-shadow ring on the web, a 1px border on Native.
      expect(thumb.border).toBe(platform === 'native' ? '1px' : '0px');
      expect(thumb.shadow).not.toBe('none');
      expect(a.fill.x).toBeCloseTo(a.rail.x, 0);
      expect(a.fill.x + a.fill.width).toBeCloseTo(thumb.x + thumb.width / 2, 0);
      if (value === 0) expect(thumb.x).toBeCloseTo(a.rail.x, 0);
      if (value === 100) expect(thumb.x + thumb.width).toBeCloseTo(a.rail.x + a.rail.width, 0);
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
    expect(end.fill.width).toBeCloseTo(end.rail.width - 10, 0);
    expect(end.thumbs[0].x + 20).toBeCloseTo(end.rail.x + end.rail.width, 0);
  });

  test(`${platform}: the white thumb gains a halo on hover, a stronger one and 22px while pressed, and stays put when disabled`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    await page.mouse.move(0, 0);
    const normal = (await appearance(page, platform)).thumbs[0];
    const center = { x: normal.x + 10, y: normal.y + 10 };
    await page.mouse.move(center.x, center.y);
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].halo).not.toBe(normal.halo);
    const hover = (await appearance(page, platform)).thumbs[0];
    await page.mouse.down();
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].halo).not.toBe(hover.halo);
    const pressed = (await appearance(page, platform)).thumbs[0];
    expect(pressed.background).toBe(normal.background);
    // The growth to pressedThumb eases in with the control motion.
    await expect.poll(async () => Math.round((await appearance(page, platform)).thumbs[0].width)).toBe(22);
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
    // The halo fades out with the control motion once the slider is disabled.
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].halo).toBe(normal.halo);
    expect(Math.round((await appearance(page, platform)).thumbs[0].width)).toBe(20);
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
    await page.mouse.click(a.track.x + a.track.width * .9, a.rail.y + 3);
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

test('vue3 Slider output options preserve numeric updates, commits and accessible value text', async ({ page }) => {
  await openAdoption(page, 'slider');
  await expect(page.locator('.kjun-slider-value').first()).toHaveText('20');
  await configureAdoption(page, { showValue: false });
  await expect(page.locator('.kjun-slider-value')).toHaveCount(0);
  await expect(page.locator('.kjun-slider').first().locator('.kjun-slider-caption')).toHaveCount(0);
  await expect(page.locator('.kjun-slider').last().locator('.kjun-slider-label')).toHaveText('Range');
  const slider = page.getByRole('slider', { name: 'Amount', exact: true });
  await configureAdoption(page, { format: true });
  await expect(slider).toHaveAttribute('aria-valuetext', '20%');
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('21');
  expect(await adoptionEvents(page)).toEqual([['commit', 21]]);
  await configureAdoption(page, { showValue: true });
  await expect(page.locator('.kjun-slider-value').first()).toHaveText('21%');
  await expect(page.locator('.kjun-slider-value').last()).toHaveText('$20 – $80');
  await expect(page.getByRole('slider').nth(1)).toHaveAttribute('aria-valuetext', '$20');
});

// Visible caption text without the slider thumbs' own text.
const caption = (page: Page, id: string) => page.getByTestId(id).evaluate(wrapper => {
  const root = wrapper.firstElementChild!.cloneNode(true) as HTMLElement;
  root.querySelectorAll('input, [role=slider]').forEach(el => el.remove());
  return root.textContent!.trim();
});
for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: showValue hides the visible value and formatValue formats it and the value text`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    const single = page.getByTestId('single').getByRole('slider'), start = page.getByTestId('range').getByRole('slider').first();
    expect(await caption(page, 'single')).toBe('알림 음량40');
    await configure(page, { showValue: false });
    await expect.poll(() => caption(page, 'single')).toBe('알림 음량');
    expect(await caption(page, 'range')).toBe('조회 범위');
    await configure(page, { label: '' });
    await expect.poll(() => caption(page, 'single')).toBe('');
    expect(await valueOf(page)).toBe(40);
    await configure(page, { label: '알림 음량', format: true });
    await expect(single).toHaveAttribute('aria-valuetext', '40%');
    await expect(start).toHaveAttribute('aria-valuetext', '$20');
    await single.press('ArrowRight');
    await expect.poll(() => valueOf(page)).toBe(41);
    await expect(page.getByTestId('events')).toContainText('change:41');
    await configure(page, { showValue: true });
    await expect.poll(() => caption(page, 'single')).toBe('알림 음량41%');
    expect(await caption(page, 'range')).toBe('조회 범위$20 – $80');
  });
}

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: overlapping range thumbs at either end still open, values use the locale format and equal values read once`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    const range = page.getByTestId('range');
    for (const [start, end] of [[0, 20], [100, 80]]) {
      await configure(page, { range: [start, start] });
      await expect.poll(() => valueOf(page, 'range')).toBe(start);
      const a = await appearance(page, platform, 'range');
      const x = (value: number) => a.track.x + a.track.width * value / 100, y = a.rail.y + a.rail.height / 2;
      await page.mouse.move(x(start), y); await page.mouse.down();
      await page.mouse.move(x(end), y, { steps: 6 }); await page.mouse.up();
      await expect.poll(() => valueOf(page, 'range', end > start ? 1 : 0)).toBe(end);
    }
    await configure(page, { min: 0, max: 1000000, step: 100, range: [500000, 500000], value: 980000 });
    await expect.poll(() => caption(page, 'range')).toBe('조회 범위500,000');
    expect(await caption(page, 'single')).toBe('알림 음량980,000');
    await expect(page.getByTestId('single').getByRole('slider')).toHaveAttribute('aria-valuetext', '980,000');
  });

  test(`${platform}: marks put dots on the rail and labels under it, and size sm shrinks rail, thumb and text`, async ({ page }) => {
    await openFixture(page, platform, '', 'slider-design');
    await configure(page, { marks: [{ value: 0, label: '작게' }, { value: 50, label: '보통' }, { value: 100, label: '크게' }], step: 25, value: 50, range: [25, 75] });
    const single = page.getByTestId('single');
    for (const text of ['작게', '보통', '크게']) await expect(single.getByText(text, { exact: true })).toBeVisible();
    const a = await appearance(page, platform);
    const box = async (text: string) => (await single.getByText(text, { exact: true }).boundingBox())!;
    const first = await box('작게'), middle = await box('보통'), last = await box('크게');
    // Edge labels align to the rail ends; the middle label centers on its mark under the band.
    expect(first.x).toBeCloseTo(a.rail.x, 0);
    expect(last.x + last.width).toBeCloseTo(a.rail.x + a.rail.width, 0);
    expect(middle.x + middle.width / 2).toBeCloseTo(a.thumbs[0].x + 10, 0);
    expect(first.y).toBeGreaterThan(a.rail.y + a.rail.height);
    expect(first.y - (a.rail.y + a.rail.height)).toBeLessThan(24);
    await configure(page, { size: 'sm', marks: false });
    await expect.poll(async () => (await appearance(page, platform)).thumbs[0].width).toBe(16);
    const sm = await appearance(page, platform);
    expect(sm.rail.height).toBe(4); expect(sm.fontSize).toBe('12px'); expect(sm.track.height).toBe(44);
  });
}
