import { expect } from './assert.mjs';
import { configure, controls, idReferences, namedControls, openLayer, primary, tabTo } from './context.mjs';
import { feedbackLabeling } from './services.mjs';
import { nativeInputPopup } from './native-selection.mjs';
async function requiredState(field, value) {
  await expect.poll(() => field.evaluate(element => element.required === true || element.getAttribute('aria-required') === 'true'),
    { message: '실제 필수 입력 의미' }).toBe(value);
}
export async function verifyLabeling(page, d, note) {
  const { profile, scenario } = d;
  if (profile === 'field') {
    for (const index of [0, 1]) {
      const field = page.locator(`[data-field="${index}"]`).locator('input,textarea').first();
      await expect(field).toHaveAccessibleName(new RegExp(`^검증 필드 ${index + 1}( \\*)?$`));
      await expect(field).toHaveAccessibleDescription(`도움말 ${index + 1}`);
      await requiredState(field, true);
    }
    await page.evaluate(() => window.configureA11y({ required: false }));
    for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) await requiredState(field, false);
    await page.evaluate(() => window.configureA11y({ required: true }));
    for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) await requiredState(field, true);
    note('FormGroup 필수 입력 상태의 전달·해제·복구');
    if (d.platform !== 'native') {
      await page.evaluate(() => window.configureA11y({ fieldRequired: false }));
      for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) await requiredState(field, false);
      await page.evaluate(() => window.configureA11y({ fieldRequired: undefined }));
      for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) await requiredState(field, true);
      note('웹 입력의 명시적인 required=false 우선·상속 복구');
    }
    await idReferences(page); note('두 필드의 이름·도움말과 고유 ID 확인');
    await page.evaluate(() => window.configureA11y({ error: '내용을 확인하세요' }));
    for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) {
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAccessibleDescription(/내용을 확인하세요/);
    }
    await idReferences(page); note('오류 메시지와 aria-invalid 연결 확인');
    await page.evaluate(() => window.configureA11y({ error: '' }));
    for (const field of await page.locator('[data-field] input,[data-field] textarea').all()) {
      await expect(field).not.toHaveAttribute('aria-invalid', 'true');
      await expect(field).not.toHaveAccessibleDescription(/내용을 확인하세요/);
    }
    await idReferences(page); note('오류 해제 후 오래된 참조 없음'); return;
  }
  if (['text', 'chart', 'image', 'progress'].includes(profile)) {
    if (profile === 'text') expect(await page.locator('body').ariaSnapshot()).toContain(scenario.text);
    if (profile === 'chart') await expect(page.getByRole('img', { name: /추세/ })).toBeVisible();
    if (profile === 'image') {
      await expect(page.getByRole('img', { name: scenario.text, exact: true })).toBeVisible();
      await configure(page, { decorative: true });
      await expect(page.getByRole('img', { name: scenario.text, exact: true })).toHaveCount(0);
      note('장식 모드의 이미지 역할 제외 확인');
    }
    if (profile === 'progress') {
      const progress = page.getByRole('progressbar').first(); await expect(progress).toBeVisible();
      expect(Number(await progress.getAttribute('aria-valuenow'))).toBe(42);
      expect(Number(await progress.getAttribute('aria-valuemin'))).toBe(0);
      expect(Number(await progress.getAttribute('aria-valuemax'))).toBe(100);
      expect(await page.locator('body').ariaSnapshot()).toMatch(/완료율|42/);
    }
    await idReferences(page); note('접근성 트리의 의미·역할 확인'); return;
  }
  if (['menu', 'dialog', 'divider'].includes(profile)) {
    await openLayer(page, d);
    if (profile === 'divider') {
      const divider = page.getByRole('separator'); await expect(divider).toHaveCount(1);
      expect(await divider.evaluate(el => el.tabIndex)).toBeLessThan(0); return;
    }
    await expect(page.getByRole(profile === 'menu' && d.platform !== 'native' ? 'menu' : 'dialog').last()).toHaveAccessibleName(/\S/);
  }
  if (profile === 'tooltip') {
    const trigger = primary(page, d); await tabTo(page, trigger);
    await expect(page.getByRole('tooltip')).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription('이 버튼의 도움말');
  }
  if (profile === 'tabs') {
    await expect(page.getByRole('tablist')).toHaveAccessibleName(/\S/);
    const tab = page.getByRole('tab', { selected: true });
    const panel = page.getByRole('tabpanel'); await expect(panel).toBeVisible();
    await expect(panel).toHaveAccessibleName('첫 탭');
    expect(await tab.getAttribute('aria-controls')).toBe(await panel.getAttribute('id'));
  }
  if (profile === 'feedback') return feedbackLabeling(page, note);
  if (['select', 'time', 'search'].includes(profile)) {
    if (d.platform === 'native' && (profile === 'search' || d.component === 'DsCombobox')) {
      const { active } = await nativeInputPopup(page);
      if (profile === 'search') { await active.fill('AAA'); await expect(page.getByRole('radio')).toBeVisible(); }
    } else if (profile === 'search') {
      await page.getByRole('combobox').fill('AAA'); await expect(page.getByRole('option')).toBeVisible();
    } else {
      await primary(page, d).click();
      await expect(page.getByRole(d.platform === 'native' ? 'dialog' : 'listbox')).toBeVisible();
    }
    await namedControls(page); note('열린 선택 도구의 이름·ID 참조 확인');
    await page.keyboard.press('Escape');
    await expect(page.getByRole(d.platform === 'native' ? 'dialog' : 'listbox')).not.toBeVisible();
  }
  if (profile === 'accordion') { await page.getByRole('button', { name: '첫 항목', exact: true }).click(); await expect(page.getByText('첫 내용', { exact: true })).toBeVisible(); }
  if (profile === 'data-state') await page.getByRole('button', { name: '조회 실패', exact: true }).click();
  await namedControls(page); note('실제 컨트롤의 이름과 모든 ID 참조 확인');
  // Field-like wrappers additionally exercise their public error state; this does not claim FormGroup propagation.
  if (['select', 'search', 'date', 'time', 'stepper'].includes(profile) && d.component !== 'DsCombobox') {
    await configure(page, { error: true });
    const field = profile === 'stepper' ? page.getByRole('spinbutton') : controls(page).first();
    await expect(field).toHaveAttribute('aria-invalid', 'true');
    await configure(page, { error: false });
    await expect(field).not.toHaveAttribute('aria-invalid', 'true');
    await idReferences(page); note('공개 error 속성의 오류 전환 확인 (FormGroup 상속과는 별도)');
  }
}
