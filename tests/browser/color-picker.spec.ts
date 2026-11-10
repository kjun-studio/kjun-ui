import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunColorPicker: a field trigger that opens a floating panel with swatches, a saturation/brightness area,
// hue and alpha sliders and hex/% inputs. Live changes report every move; a commit reports once per finished pick.
const section = (page: Page, id: string) => page.getByTestId(id);
const trigger = (page: Page, id: string, label: string) => section(page, id).getByRole('button', { name: new RegExp('^' + label) });
const list = async (page: Page, id: string, kind: 'changes' | 'commits') => JSON.parse(await page.getByTestId(id + '-' + kind).textContent() || '[]');
const area = (page: Page) => page.getByRole('slider', { name: '채도와 명도' });
const hue = (page: Page) => page.getByRole('slider', { name: '색상' });
const hex = (page: Page) => page.getByRole('textbox', { name: 'HEX 색 코드' });
const swatches = (page: Page) => page.getByRole('radiogroup', { name: '견본 색' });

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const web = platform !== 'native';
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1400 });
      await openFixture(page, platform, '', 'color-picker');
    });

    test('the trigger names the value, opens the panel and gets focus back on Escape', async ({ page }) => {
      const t = trigger(page, 'cp-full', '라벨 색');
      await expect(t).toHaveAccessibleName(/#3B82F6, 투명도 50%/);
      if (web) await expect(t).toHaveAttribute('aria-haspopup', 'dialog');
      await t.click();
      await expect(area(page)).toBeVisible();
      if (web) await expect(t).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(area(page)).toHaveCount(0);
      if (web) await expect(t).toBeFocused();
      await trigger(page, 'cp-custom', '강조색').click();
      await expect(area(page)).toBeFocused();
    });

    test('swatches are one radio group with a no-color choice; picking keeps the panel open', async ({ page }) => {
      await trigger(page, 'cp-swatches', '태그 색').click();
      const group = swatches(page);
      const radios = group.getByRole('radio');
      // "nope" is dropped; the duplicate #22C55E stays but only its first copy is checked.
      await expect(radios).toHaveCount(9);
      await expect(radios.first()).toHaveAccessibleName('색 없음');
      await expect(group.locator('[aria-checked="true"]')).toHaveCount(1);
      await group.getByRole('radio', { name: '#EF4444' }).click();
      await expect.poll(() => list(page, 'cp-swatches', 'changes')).toEqual(['#EF4444']);
      await expect.poll(() => list(page, 'cp-swatches', 'commits')).toEqual(['#EF4444']);
      await expect(group).toBeVisible();
      if (web) {
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => list(page, 'cp-swatches', 'changes')).toEqual(['#EF4444', '#F97316']);
        await expect(group.getByRole('radio', { name: '#F97316' })).toBeFocused();
      }
      await group.getByRole('radio', { name: '색 없음' }).click();
      await expect.poll(async () => (await list(page, 'cp-swatches', 'commits')).at(-1)).toBeNull();
      await expect(trigger(page, 'cp-swatches', '태그 색')).toHaveAccessibleName(/색 없음/);
    });

    test('dragging the area reports every move and commits once, even when released outside', async ({ page }) => {
      await trigger(page, 'cp-gray', '회색 확인').click();
      const box = (await area(page).boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      for (const step of [10, 30, 50]) await page.mouse.move(box.x + step, box.y + step, { steps: 2 });
      await page.mouse.move(box.x - 200, box.y + box.height + 200, { steps: 2 });
      await page.mouse.up();
      expect((await list(page, 'cp-gray', 'changes')).length).toBeGreaterThanOrEqual(3);
      await expect.poll(() => list(page, 'cp-gray', 'commits')).toHaveLength(1);
      // Released past the bottom left corner: no saturation, no brightness.
      expect((await list(page, 'cp-gray', 'commits'))[0]).toBe('#000000');
    });

    test('the area and hue slider move by keys and keep the hue through gray', async ({ page }) => {
      await trigger(page, 'cp-gray', '회색 확인').click();
      await expect(area(page)).toHaveAttribute('aria-valuetext', '채도 76%, 명도 96%');
      // The panel moves focus to the area on open; keys go there once it lands.
      await expect(area(page)).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect(area(page)).toHaveAttribute('aria-valuetext', '채도 77%, 명도 96%');
      await page.keyboard.press('Shift+ArrowUp');
      await expect(area(page)).toHaveAttribute('aria-valuetext', '채도 77%, 명도 100%');
      await expect.poll(() => list(page, 'cp-gray', 'commits')).toHaveLength(2);
      // Saturation 0 is gray; End brings the same blue back instead of red.
      await page.keyboard.press('Home');
      expect((await list(page, 'cp-gray', 'commits')).at(-1)).toBe('#FFFFFF');
      await page.keyboard.press('End');
      const back = (await list(page, 'cp-gray', 'commits')).at(-1) as string;
      const [r, g, b] = [1, 3, 5].map(i => parseInt(back.slice(i, i + 2), 16));
      expect(b).toBeGreaterThan(r); expect(b).toBeGreaterThan(g);
      await hue(page).focus();
      await page.keyboard.press('End');
      await expect(hue(page)).toHaveAttribute('aria-valuenow', '360');
      await expect(hue(page)).toHaveAttribute('aria-valuetext', '360도');
    });

    test('the hex field reports full codes only and expands short codes on commit', async ({ page }) => {
      await trigger(page, 'cp-custom', '강조색').click();
      await hex(page).fill('3B8');
      expect(await list(page, 'cp-custom', 'changes')).toEqual([]);
      await hex(page).press('Enter');
      await expect.poll(() => list(page, 'cp-custom', 'commits')).toEqual(['#33BB88']);
      await expect(hex(page)).toHaveValue('33BB88');
      await hex(page).fill('3b82f6');
      await expect.poll(() => list(page, 'cp-custom', 'changes')).toEqual(['#33BB88', '#3B82F6']);
      // A complete code changes the value at once but commits only on Enter or leaving the field.
      expect(await list(page, 'cp-custom', 'commits')).toEqual(['#33BB88']);
      await hex(page).fill('xyz');
      await hex(page).press('Enter');
      await expect(hex(page)).toHaveValue('3B82F6');
      // Not clearable: an empty field goes back to the value.
      await hex(page).fill('');
      await hex(page).press('Enter');
      await expect(hex(page)).toHaveValue('3B82F6');
      expect(await list(page, 'cp-custom', 'commits')).toEqual(['#33BB88', '#3B82F6']);
    });

    test('the hex field takes six digits, and a pasted code with # fits', async ({ page }) => {
      await trigger(page, 'cp-custom', '강조색').click();
      await hex(page).pressSequentially('3B82F6A');
      await expect(hex(page)).toHaveValue('3B82F6');
      await expect.poll(() => list(page, 'cp-custom', 'changes')).toEqual(['#3B82F6']);
      await hex(page).fill('#22C55E');
      await expect(hex(page)).toHaveValue('22C55E');
      await expect.poll(() => list(page, 'cp-custom', 'changes')).toEqual(['#3B82F6', '#22C55E']);
    });

    test('a quick tap on the area changes and commits once', async ({ page }) => {
      await trigger(page, 'cp-gray', '회색 확인').click();
      await area(page).click({ position: { x: 20, y: 20 } });
      await expect.poll(() => list(page, 'cp-gray', 'commits')).toHaveLength(1);
      expect(await list(page, 'cp-gray', 'changes')).toHaveLength(1);
    });

    test('a custom trigger in a form group still reads the label and value', async ({ page }) => {
      const t = section(page, 'cp-custom-trigger').getByRole('button');
      await expect(t).toHaveAccessibleName(/커스텀 색/);
      await expect(t).toHaveAccessibleName(/#3B82F6/);
    });

    test('a short hex code keeps the current opacity', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      await hex(page).fill('3B8');
      await hex(page).press('Enter');
      await expect.poll(async () => (await list(page, 'cp-full', 'commits')).at(-1)).toBe('#33BB8880');
    });

    test('alpha keeps eight digits and the % field sets it', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      await expect(page.getByRole('slider', { name: '투명도' })).toHaveAttribute('aria-valuenow', '50');
      await page.getByRole('textbox', { name: '투명도' }).fill('80');
      await expect.poll(async () => (await list(page, 'cp-full', 'changes')).at(-1)).toBe('#3B82F6CC');
      await page.getByRole('textbox', { name: '투명도' }).press('Enter');
      await expect.poll(async () => (await list(page, 'cp-full', 'commits')).at(-1)).toBe('#3B82F6CC');
      await expect(trigger(page, 'cp-full', '라벨 색')).toHaveAccessibleName(/투명도 80%/);
    });

    test('typing a % changes on every whole number and commits once on Enter', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      const percent = page.getByRole('textbox', { name: '투명도' });
      await percent.fill('');
      await percent.pressSequentially('80');
      await expect.poll(() => list(page, 'cp-full', 'changes')).toEqual(['#3B82F614', '#3B82F6CC']);
      expect(await list(page, 'cp-full', 'commits')).toEqual([]);
      await percent.press('Enter');
      await expect.poll(() => list(page, 'cp-full', 'commits')).toEqual(['#3B82F6CC']);
      // Leaving the field after Enter commits nothing more.
      await hex(page).focus();
      await page.waitForTimeout(100);
      expect(await list(page, 'cp-full', 'commits')).toEqual(['#3B82F6CC']);
    });

    test('passing through the fields without typing changes nothing', async ({ page }) => {
      // AA 81 is 50.6%: the field shows 51, which would write back 82 if leaving it committed the shown text.
      await trigger(page, 'cp-alpha-round', '반올림').click();
      await page.getByRole('textbox', { name: '투명도' }).focus();
      await hex(page).focus();
      await page.getByRole('textbox', { name: '투명도' }).focus();
      await page.keyboard.press('Escape');
      await expect(hex(page)).toHaveCount(0);
      expect(await list(page, 'cp-alpha-round', 'changes')).toEqual([]);
      expect(await list(page, 'cp-alpha-round', 'commits')).toEqual([]);
    });

    test('closing the panel while typing commits the typed color once', async ({ page }) => {
      await trigger(page, 'cp-custom', '강조색').click();
      await hex(page).fill('ff0000');
      await expect.poll(() => list(page, 'cp-custom', 'changes')).toEqual(['#FF0000']);
      expect(await list(page, 'cp-custom', 'commits')).toEqual([]);
      await page.keyboard.press('Escape');
      await expect.poll(() => list(page, 'cp-custom', 'commits')).toEqual(['#FF0000']);
      await expect(hex(page)).toHaveCount(0);
      expect(await list(page, 'cp-custom', 'commits')).toEqual(['#FF0000']);
    });

    test('recent colors leave out the swatches, show under them and take the new value first when the panel closes', async ({ page }) => {
      const recentList = async () => JSON.parse(await page.getByTestId('cp-recent-list').textContent() || '[]');
      await trigger(page, 'cp-recent', '최근 색').click();
      const recent = page.getByRole('radiogroup', { name: '최근 사용 색' });
      // #EF4444 is already a swatch one tap away, so the recent row shows only #0EA5E9; both rows get a caption.
      await expect(recent.getByRole('radio')).toHaveCount(1);
      await expect(page.getByText('견본 색', { exact: true })).toBeVisible();
      await expect(page.getByText('최근 사용 색', { exact: true })).toBeVisible();
      await hex(page).fill('7C3AED');
      await hex(page).press('Enter');
      // The row stays put while the panel is open.
      expect(await recentList()).toEqual(['#0EA5E9', '#EF4444']);
      await page.keyboard.press('Escape');
      await expect.poll(recentList).toEqual(['#7C3AED', '#0EA5E9', '#EF4444']);
      await expect(swatches(page)).toHaveCount(0);
      await trigger(page, 'cp-recent', '최근 색').click();
      await expect(recent.getByRole('radio')).toHaveCount(2);
      await expect(recent.getByRole('radio').first()).toHaveAccessibleName('#7C3AED');
      await expect(recent.getByRole('radio').first()).toHaveAttribute('aria-checked', 'true');
      // Picking a recent color is a pick like any swatch; closing without a new value leaves the list alone.
      await recent.getByRole('radio', { name: '#0EA5E9' }).click();
      await page.keyboard.press('Escape');
      await expect.poll(recentList).toEqual(['#0EA5E9', '#7C3AED', '#EF4444']);
      await expect(swatches(page)).toHaveCount(0);
      await trigger(page, 'cp-recent', '최근 색').click();
      await page.keyboard.press('Escape');
      await expect(swatches(page)).toHaveCount(0);
      expect(await recentList()).toEqual(['#0EA5E9', '#7C3AED', '#EF4444']);
      // Without recent colors the swatches need no caption.
      await trigger(page, 'cp-swatches', '태그 색').click();
      await expect(page.getByText('견본 색', { exact: true })).toHaveCount(0);
    });

    test('a named swatch names the trigger, with the code after it', async ({ page }) => {
      const t = trigger(page, 'cp-named', '이름 색');
      await expect(t).toHaveAccessibleName(/빨강, #EF4444/);
      await expect(t).toContainText('빨강');
      await expect(t).toContainText('#EF4444');
      await t.click();
      await swatches(page).getByRole('radio', { name: '#22C55E' }).click();
      await expect(t).toHaveAccessibleName(/#22C55E/);
      await expect(t).not.toHaveAccessibleName(/빨강|파랑/);
      if (web) await expect(swatches(page).getByRole('radio', { name: '파랑' })).toHaveAttribute('title', '파랑');
    });

    test('with no value the area shows a hint instead of a thumb and the hex field a placeholder', async ({ page }) => {
      await trigger(page, 'cp-custom', '강조색').click();
      await expect(page.getByText('여기서 색을 고르세요', { exact: true })).toBeVisible();
      await expect(hex(page)).toHaveAttribute('placeholder', 'RRGGBB');
      if (web) await expect(area(page).locator('.kjun-color-thumb')).toHaveCount(0);
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText('여기서 색을 고르세요', { exact: true })).toHaveCount(0);
      if (web) await expect(area(page).locator('.kjun-color-thumb')).toHaveCount(1);
    });

    test('the fields show # and % beside the digits without covering them', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      const sign = page.getByText('#', { exact: true }), percent = page.getByText('%', { exact: true });
      await expect(sign).toBeVisible();
      await expect(percent).toBeVisible();
      const [s, field] = [(await sign.boundingBox())!, (await hex(page).boundingBox())!];
      expect(s.x).toBeGreaterThan(field.x);
      expect(s.x + s.width).toBeLessThan(field.x + field.width / 4);
      if (web) {
        // The digits start after the sign.
        const textStart = await hex(page).evaluate(el => el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).paddingLeft));
        expect(textStart).toBeGreaterThanOrEqual(s.x + s.width);
      }
    });

    test('every row lines up, thumbs stay inside, and the sliders and swatches group by spacing', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      const alphaSlider = page.getByRole('slider', { name: '투명도' });
      const boxes = () => Promise.all([area(page), hue(page), alphaSlider, hex(page), swatches(page)].map(async l => (await l.boundingBox())!));
      // Native Web scales the panel in: measure once its opening motion has settled.
      // The tracks run the full content width like the area, fields and swatches; hue and opacity sit closer to each other
      // than to the rest, and the swatches start a new group.
      await expect.poll(async () => {
        const [a, h, al, field, group] = await boxes();
        return [h.x - a.x, h.width - a.width, al.width - a.width, al.y - h.y - h.height, group.y - field.y - field.height].map(Math.round);
      }).toEqual([0, 0, 0, web ? 8 : 20, 20]);
      const [a] = await boxes();
      if (web) {
        await area(page).focus();
        await page.keyboard.press('End');
        await page.keyboard.press('PageUp');
        await page.keyboard.press('PageUp');
        await page.keyboard.press('PageUp');
        const thumb = (await area(page).locator('.kjun-color-thumb').boundingBox())!;
        expect(thumb.x + thumb.width).toBeLessThanOrEqual(a.x + a.width + 0.5);
        expect(thumb.y).toBeGreaterThanOrEqual(a.y - 0.5);
        // The area and the fields share one corner radius.
        const radii = await Promise.all([area(page), hex(page)].map(l => l.evaluate(el => getComputedStyle(el).borderTopLeftRadius)));
        expect(radii[0]).toBe(radii[1]);
      }
    });

    // Web only: the floating panel opens with a hidden dismiss button, so the section is never its first child. Native sets the gap explicitly.
    if (web) test('a swatches-only panel starts at its padding, with no section gap above', async ({ page }) => {
      await trigger(page, 'cp-swatches', '태그 색').click();
      const gap = async () => Math.round((await swatches(page).boundingBox())!.y - (await page.locator('.kjun-color-panel').boundingBox())!.y);
      await expect.poll(gap).toBe(12);
    });

    test('pressing the left edge of a track or the area picks its first value', async ({ page }) => {
      await trigger(page, 'cp-gray', '회색 확인').click();
      const box = (await hue(page).boundingBox())!;
      await page.mouse.click(box.x + 2, box.y + box.height / 2);
      await expect(hue(page)).toHaveAttribute('aria-valuenow', '0');
      const end = (await area(page).boundingBox())!;
      // Inside the rounded corner, but within the half-thumb margin: still the far corner of the range.
      await page.mouse.click(end.x + end.width - 6, end.y + 6);
      await expect(area(page)).toHaveAttribute('aria-valuetext', '채도 100%, 명도 100%');
    });

    test('the eyedropper picks a screen color once and keeps the opacity', async ({ page }) => {
      await page.addInitScript(() => { (window as any).EyeDropper = class { open() { return Promise.resolve({ sRGBHex: '#0ea5e9' }); } }; });
      await openFixture(page, platform, '', 'color-picker');
      await trigger(page, 'cp-eyedropper', '스포이드').click();
      const button = page.getByRole('button', { name: '화면에서 색 고르기' });
      // A ghost icon button: no fill until hovered, so it does not read as another field.
      if (web) expect(await button.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
      await button.click();
      await expect.poll(() => list(page, 'cp-eyedropper', 'commits')).toEqual(['#0EA5E980']);
      expect(await list(page, 'cp-eyedropper', 'changes')).toEqual(['#0EA5E980']);
      await expect(hex(page)).toHaveValue('0EA5E9');
    });

    test('the no-color slash is neutral, not the danger color', async ({ page }) => {
      await trigger(page, 'cp-full', '라벨 색').click();
      const none = swatches(page).getByRole('radio', { name: '색 없음' });
      if (web) {
        const [slash, danger, tertiary] = await none.evaluate(el => {
          const probe = (v: string) => { const p = document.createElement('span'); p.style.color = `var(${v})`; el.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
          return [getComputedStyle(el.querySelector('[data-none] > span')!).backgroundImage, probe('--_kjun-color-danger'), probe('--_kjun-color-text-tertiary')];
        });
        expect(slash).not.toContain(danger);
        expect(slash).toContain(tertiary);
      } else {
        // The fixture's demo palette: danger #C52F3B, textTertiary #737373.
        const fills = (await none.evaluate(el => [...el.querySelectorAll('rect')].map(r => r.getAttribute('fill')))).join(' ').toUpperCase();
        expect(fills).not.toContain('#C52F3B');
        expect(fills).toContain('#737373');
      }
    });

    test('without a browser eyedropper the button is not drawn', async ({ page }) => {
      await page.addInitScript(() => { delete (window as any).EyeDropper; });
      await openFixture(page, platform, '', 'color-picker');
      await trigger(page, 'cp-eyedropper', '스포이드').click();
      await expect(hex(page)).toBeVisible();
      await expect(page.getByRole('button', { name: '화면에서 색 고르기' })).toHaveCount(0);
    });

    test('an outside value is followed without echo, and alpha is dropped when the picker has none', async ({ page }) => {
      await section(page, 'cp-controlled').getByRole('button', { name: '외부 변경' }).click();
      await trigger(page, 'cp-controlled', '제어 색').click();
      await expect(hue(page)).toHaveAttribute('aria-valuenow', '0');
      await expect(hex(page)).toHaveValue('FF0000');
      expect(await list(page, 'cp-controlled', 'changes')).toEqual([]);
      await page.keyboard.press('Escape');
      // Wait out the closing motion so only the next panel's field is on the page.
      await expect(hex(page)).toHaveCount(0);
      await expect(trigger(page, 'cp-alpha-off', '알파 끔')).toHaveAccessibleName(/#3B82F6$/);
      await trigger(page, 'cp-alpha-off', '알파 끔').click();
      await expect(hex(page)).toHaveValue('3B82F6');
      expect(await list(page, 'cp-alpha-off', 'changes')).toEqual([]);
    });

    test('disabled and read-only triggers stay closed; read-only still submits', async ({ page }) => {
      const states = section(page, 'cp-states');
      if (web) await expect(states.getByRole('button', { name: /^비활성/ })).toBeDisabled();
      await states.getByRole('button', { name: /^읽기 전용/ }).click();
      await expect(swatches(page)).toHaveCount(0);
      if (web) {
        await expect(states.getByRole('button', { name: /^오류/ })).toHaveAttribute('aria-invalid', 'true');
        await states.getByRole('button', { name: '제출' }).click();
        await expect(page.getByTestId('cp-submitted')).toHaveText('#3B82F6');
      }
    });

    test('panel, area, swatches and triggers take their token sizes', async ({ page }) => {
      for (const [size, height] of [['sm', 32], ['md', 40], ['lg', 48]] as const)
        expect(Math.round((await trigger(page, 'cp-sizes', '크기 ' + size).boundingBox())!.height)).toBe(height);
      const full = trigger(page, 'cp-full', '라벨 색');
      const triggerWidth = (await full.boundingBox())!.width;
      await full.click();
      const areaBox = (await area(page).boundingBox())!;
      expect(Math.round(areaBox.height)).toBe(160);
      // A mouse gets the 240px panel; Native is touch and follows the trigger up to 360px.
      const content = web ? 240 - 2 * 12 : Math.round(Math.min(triggerWidth, 360)) - 2 * 12;
      expect(Math.round(areaBox.width)).toBe(content);
      // Eight fixed columns fill the content width: (216 - 7 × 8) / 8 = 20px a swatch, so 'none' + 7 colors make one row.
      const radios = swatches(page).getByRole('radio');
      const eight = () => Promise.all([...Array(8).keys()].map(async i => (await radios.nth(i).boundingBox())!));
      // Native Web scales the panel in and measures the row: read it once one row holds all eight.
      await expect.poll(async () => new Set((await eight()).map(box => Math.round(box.y))).size).toBe(1);
      const boxes = await eight();
      const [a, b] = boxes;
      expect(Math.round(a.width)).toBe(Math.round((content - 7 * 8) / 8));
      expect(Math.round(a.height)).toBe(Math.round((content - 7 * 8) / 8));
      expect(Math.round(b.x - a.x - a.width)).toBe(8);
      expect(new Set(boxes.map(box => Math.round(box.y))).size).toBe(1);
      expect(Math.round(a.x)).toBe(Math.round(areaBox.x));
      expect(Math.round(boxes[7].x + boxes[7].width)).toBe(Math.round(areaBox.x + areaBox.width));
      if (web) {
        await radios.nth(2).focus();
        await page.keyboard.press('ArrowLeft');
        const ring = await radios.nth(1).evaluate(el => [getComputedStyle(el).boxShadow, getComputedStyle(el).outlineStyle]);
        expect(ring[0]).not.toBe('none');
        expect(ring[1]).toBe('none');
      }
      await page.keyboard.press('Escape');
      await expect(area(page)).toHaveCount(0);
      // Nine choices: the ninth starts the second row in the first column.
      await trigger(page, 'cp-swatches', '태그 색').click();
      // Native Web scales the panel in, so read the rows once its opening motion has settled.
      const nine = swatches(page).getByRole('radio');
      const rows = async () => {
        const [first, eighth, ninth] = [(await nine.nth(0).boundingBox())!, (await nine.nth(7).boundingBox())!, (await nine.nth(8).boundingBox())!];
        return [Math.round(eighth.y - first.y), Math.round(ninth.x - first.x), Math.round(ninth.y - first.y - first.height)];
      };
      await expect.poll(rows).toEqual([0, 0, 8]);
    });
    if (web) test.describe('on a touch screen', () => {
      test.use({ hasTouch: true, isMobile: true, viewport: { width: 1024, height: 1400 } });
      test('the panel follows the trigger width and the sliders get taller targets', async ({ page }) => {
        await openFixture(page, platform, '', 'color-picker');
        const t = trigger(page, 'cp-full', '라벨 색');
        await t.click();
        const boxes = () => Promise.all([t, area(page), hue(page), page.getByRole('slider', { name: '투명도' })].map(async l => (await l.boundingBox())!));
        // The panel moves while it opens: measure once it has settled.
        await expect.poll(async () => {
          const [tb, a, h, al] = await boxes();
          return [Math.round(a.width) - (Math.round(Math.min(tb.width, 360)) - 24), Math.round(al.y - h.y - h.height)];
        }).toEqual([0, 20]);
        const [, , h] = await boxes();
        // A press 10px above the hue track still lands on it.
        const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('[role="slider"]')?.getAttribute('aria-label'), [h.x + h.width / 2, h.y - 8]);
        expect(hit).toBe('색상');
      });
    });
  });
}
