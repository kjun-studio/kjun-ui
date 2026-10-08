import { expect } from './assert.mjs';
import { idReferences, namedControls, tabTo } from './context.mjs';
async function openRequest(page, name) {
  const trigger = page.getByRole('button', { name: name + ' 요청', exact: true });
  await tabTo(page, trigger); await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog').last(); await expect(dialog).toBeVisible();
  return { trigger, dialog };
}
async function toast(page) {
  const trigger = page.getByRole('button', { name: 'Toast 표시', exact: true });
  await tabTo(page, trigger); await page.keyboard.press('Enter');
  const alert = page.getByRole('alert').or(page.getByRole('status')).filter({ hasText: '저장했습니다' }).last();
  await expect(alert).toBeVisible(); return { trigger, alert };
}
export async function feedbackKeyboard(page, note) {
  const { alert } = await toast(page);
  const close = alert.getByRole('button'); await tabTo(page, close); await page.keyboard.press('Enter');
  await expect(alert).not.toBeVisible(); note('Toast 키보드 닫기');
  const { dialog } = await openRequest(page, 'Confirm');
  await tabTo(page, dialog.getByRole('button', { name: '취소', exact: true })); await page.keyboard.press('Space');
  await expect(dialog).not.toBeVisible(); note('Confirm 키보드 취소');
  const prompt = (await openRequest(page, 'Prompt')).dialog;
  const submit = prompt.getByRole('button', { name: '확인', exact: true });
  await tabTo(page, submit); await page.keyboard.press('Enter');
  await expect(prompt.getByText('두 글자 이상 입력하세요.', { exact: true })).toBeVisible();
  const input = prompt.getByRole('textbox'); await tabTo(page, input); await input.fill('완료');
  await tabTo(page, submit); await page.keyboard.press('Enter'); await expect(prompt).not.toBeVisible();
  note('Prompt 오류 안내·입력·확정');
}
export async function feedbackLabeling(page, note) {
  const { alert } = await toast(page); await expect(alert).toContainText('저장했습니다');
  note('Toast live 역할과 메시지');
  await alert.getByRole('button').click();
  const { dialog } = await openRequest(page, 'Prompt');
  await expect(dialog).toHaveAccessibleName('목록 이름 입력');
  const input = dialog.getByRole('textbox'); await expect(input).toHaveAccessibleName(/\S/);
  await dialog.getByRole('button', { name: '확인', exact: true }).click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toHaveAccessibleDescription(/두 글자 이상 입력하세요/);
  await namedControls(page); await idReferences(page); note('Prompt 이름·오류 설명·ID 연결');
}
export async function feedbackFocus(page, note) {
  const { trigger, alert } = await toast(page); await expect(trigger).toBeFocused();
  await alert.getByRole('button').click(); note('Toast가 초기 포커스를 빼앗지 않음');
  for (const name of ['Confirm', 'Prompt']) {
    const { trigger, dialog } = await openRequest(page, name);
    await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    const count = await dialog.locator('button,input,[tabindex="0"]').count();
    for (let i = 0; i < count + 1; i++) {
      await page.keyboard.press('Tab'); expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(trigger).toBeFocused();
    note(name + ' 초기 포커스·Tab 제한·Escape 복귀');
  }
}
