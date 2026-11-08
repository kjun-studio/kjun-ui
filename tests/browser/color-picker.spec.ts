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
      await hex(page).fill('xyz');
      await hex(page).press('Enter');
      await expect(hex(page)).toHaveValue('3B82F6');
      // Not clearable: an empty field goes back to the value.
      await hex(page).fill('');
      await hex(page).press('Enter');
      await expect(hex(page)).toHaveValue('3B82F6');
      expect(await list(page, 'cp-custom', 'commits')).toEqual(['#33BB88', '#3B82F6']);
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

    test('an outside value is followed without echo, and alpha is dropped when the picker has none', async ({ page }) => {
      await section(page, 'cp-controlled').getByRole('button', { name: '외부 변경' }).click();
      await trigger(page, 'cp-controlled', '제어 색').click();
      await expect(hue(page)).toHaveAttribute('aria-valuenow', '0');
      await expect(hex(page)).toHaveValue('FF0000');
      expect(await list(page, 'cp-controlled', 'changes')).toEqual([]);
      await page.keyboard.press('Escape');
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
      await trigger(page, 'cp-full', '라벨 색').click();
      const areaBox = (await area(page).boundingBox())!;
      expect(Math.round(areaBox.height)).toBe(160);
      expect(Math.round(areaBox.width)).toBe(240 - 2 * 12);
      const radios = swatches(page).getByRole('radio');
      const [a, b] = [(await radios.nth(0).boundingBox())!, (await radios.nth(1).boundingBox())!];
      expect(Math.round(a.width)).toBe(24);
      expect(Math.round(b.x - a.x - a.width)).toBe(8);
      if (web) {
        await radios.nth(2).focus();
        await page.keyboard.press('ArrowLeft');
        const ring = await radios.nth(1).evaluate(el => [getComputedStyle(el).boxShadow, getComputedStyle(el).outlineStyle]);
        expect(ring[0]).not.toBe('none');
        expect(ring[1]).toBe('none');
      }
    });
  });
}
