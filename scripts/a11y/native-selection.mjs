import { expect } from './assert.mjs';
import { snapshot, stateChanged } from './context.mjs';
// Native selection uses a Modal with a second input and radio options, not a DOM listbox.
export async function nativeInputPopup(page) {
  const input = page.getByRole('textbox').first();
  for (let i = 0; i < 20 && !(await page.getByRole('dialog').count()); i++) await page.keyboard.press('Tab');
  const dialog = page.getByRole('dialog').last(); await expect(dialog).toBeVisible();
  const active = dialog.getByRole('textbox'); await expect(active).toBeFocused();
  return { input, dialog, active };
}
export async function nativeSelectionKeyboard(page, d, note) {
  if (d.profile === 'search' || d.component === 'DsCombobox') {
    const { active, dialog } = await nativeInputPopup(page);
    if (d.profile === 'search') { await active.fill('AAA'); await expect(dialog.getByRole('radio')).toBeVisible(); }
    const before = await snapshot(page);
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await stateChanged(page, before); await expect(dialog).not.toBeVisible();
    note('Native Web 입력 팝업의 방향키 선택');
  } else {
    const trigger = page.getByRole('button').first(); await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    const before = await snapshot(page);
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await stateChanged(page, before); await expect(dialog).not.toBeVisible(); note('Native Web 선택 Modal의 방향키 선택');
  }
}
export async function nativeSelectionFocus(page, d, note) {
  if (d.profile === 'search' || d.component === 'DsCombobox') {
    const { input, dialog, active } = await nativeInputPopup(page);
    await expect(active).toBeFocused(); note('입력 포커스가 Modal 내부 입력으로 이동');
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(input).toBeFocused();
    note('Escape로 닫힌 뒤 외부 입력으로 복귀');
  } else {
    const trigger = page.getByRole('button').first(); await trigger.focus(); await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
    await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
    note('선택 Modal의 초기 포커스·Escape 복귀');
  }
}
