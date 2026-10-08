import { expect } from './assert.mjs';
import { configure, controls, openLayer, primary, snapshot, stateChanged, tabTo } from './context.mjs';
import { feedbackKeyboard } from './services.mjs';
import { nativeSelectionKeyboard } from './native-selection.mjs';
const events = page => page.evaluate(() => window.__a11yEvents.length);
async function activate(page, target, key = 'Enter') { await tabTo(page, target); await page.keyboard.press(key); }
export async function verifyKeyboard(page, d, note) {
  const { profile, component } = d;
  if (profile === 'feedback') return feedbackKeyboard(page, note);
  if (d.platform === 'native' && ['select', 'search', 'time'].includes(profile)) return nativeSelectionKeyboard(page, d, note);
  if (profile === 'field') {
    const input = primary(page, d); await tabTo(page, input); await page.keyboard.type('검증');
    await expect(input).toHaveValue('검증'); await expect(page.getByTestId('field-value')).toHaveText('검증');
    await page.evaluate(() => window.configureA11y({ disabled: true }));
    await expect(input).toBeDisabled(); await expect(input).not.toBeEditable();
    await page.keyboard.type('차단'); await expect(input).toHaveValue('검증');
    await page.getByTestId('field-before').focus(); await page.keyboard.press('Tab');
    await expect(page.getByTestId('field-after')).toBeFocused();
    await page.evaluate(() => window.configureA11y({ disabled: false, readOnly: true }));
    await expect(input).toBeEnabled(); await expect(input).not.toBeEditable();
    await page.getByTestId('field-before').focus(); await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    await page.keyboard.type('차단'); await expect(input).toHaveValue('검증');
    await page.evaluate(() => window.configureA11y({ readOnly: false }));
    await expect(input).toBeEditable();
    note('텍스트 입력·비활성 Tab 제외·읽기 전용 진입과 편집 차단·편집 복구'); return;
  }
  if (profile === 'boundary') {
    await expect(page.getByText('예제 렌더 오류', { exact: true })).toBeVisible();
    if (d.platform === 'vue2') {
      const navigation = page.waitForEvent('framenavigated');
      await activate(page, page.getByRole('button', { name: '새로고침', exact: true })); await navigation;
      note('Vue 오류 경계의 명시된 새로고침 동작');
    } else {
      await activate(page, page.getByRole('button').first()); await expect(page.getByTestId('resets')).toHaveText('1');
      note('오류 경계의 reset 콜백');
    }
    return;
  }
  if (profile === 'dialog') {
    const { layer } = await openLayer(page, d); await expect(layer).toHaveAccessibleName(/\S/);
    await page.keyboard.press('Escape'); await expect(layer).not.toBeVisible(); note('Enter 열기·Escape 닫기'); return;
  }
  if (profile === 'tooltip') {
    await tabTo(page, primary(page, d)); await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).not.toBeVisible(); note('키보드 도움말 표시·Escape 닫기'); return;
  }
  if (profile === 'menu') {
    const { layer } = await openLayer(page, d, 'ArrowDown');
    const before = await page.evaluate(() => document.activeElement?.textContent);
    await page.keyboard.press('ArrowDown');
    expect(await page.evaluate(() => document.activeElement?.textContent), '방향키 항목 이동').not.toBe(before);
    const count = await events(page); await page.keyboard.press('Enter');
    await expect.poll(() => events(page)).toBeGreaterThan(count); await expect(layer).not.toBeVisible();
    await openLayer(page, d); await page.keyboard.press('Escape'); await expect(layer).not.toBeVisible();
    note('메뉴 방향키·항목 실행·Escape'); return;
  }
  if (profile === 'radio') {
    const radios = page.getByRole('radio'), first = radios.first(), next = radios.last();
    await tabTo(page, first); await page.keyboard.press('ArrowRight');
    await expect(next).toBeChecked(); await expect(first).not.toBeChecked(); note('다음 활성 라디오로 이동·단일 선택'); return;
  }
  if (profile === 'tabs') {
    const first = page.getByRole('tab', { name: '첫 탭', exact: true });
    await tabTo(page, first); await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: '둘째 탭', exact: true })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('둘째 내용', { exact: true })).toBeVisible();
    await expect(page.getByText('첫 내용', { exact: true })).not.toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: '비활성 탭' })).not.toHaveAttribute('aria-selected', 'true');
    note('방향키 탭·패널 전환·비활성 제외'); return;
  }
  if (profile === 'accordion') {
    const button = page.getByRole('button', { name: '첫 항목', exact: true });
    await activate(page, button); await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('첫 내용', { exact: true })).toBeVisible();
    await page.keyboard.press('Space'); await expect(button).toHaveAttribute('aria-expanded', 'false');
    note('Enter·Space 펼침 상태 전환'); return;
  }
  if (profile === 'slider') {
    for (const slider of await page.getByRole('slider').all()) {
      await tabTo(page, slider);
      const value = await slider.evaluate(el => Number(el.getAttribute('aria-valuenow') ?? el.value));
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => slider.evaluate(el => Number(el.getAttribute('aria-valuenow') ?? el.value))).toBeGreaterThan(value);
      expect(await slider.evaluate(el => Number(el.getAttribute('aria-valuenow') ?? el.value) <= Number(el.getAttribute('aria-valuemax') ?? el.max))).toBe(true);
    }
    note('각 슬라이더의 방향키 값 변경·범위 확인'); return;
  }
  if (profile === 'select') {
    const trigger = primary(page, d); await tabTo(page, trigger); await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    const before = await snapshot(page); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
    await stateChanged(page, before); await expect(page.getByRole('listbox')).not.toBeVisible();
    await tabTo(page, trigger); await page.keyboard.press('ArrowDown'); await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('listbox')).not.toBeVisible(); note('옵션 키보드 선택·Escape'); return;
  }
  if (profile === 'search') {
    const input = page.getByRole('combobox'); await tabTo(page, input); await page.keyboard.type('AAA');
    await expect(page.getByRole('option')).toBeVisible(); await page.keyboard.press('ArrowDown');
    const id = await input.getAttribute('aria-activedescendant'); expect(id).toBeTruthy();
    expect(await page.locator('[id]').evaluateAll((els, id) => els.filter(el => el.id === id).length, id)).toBe(1);
    await page.keyboard.press('Enter'); await expect(input).toHaveValue('긴 한국어 자산 이름');
    await expect(page.getByRole('listbox')).not.toBeVisible();
    await input.fill('AAA'); await expect(page.getByRole('listbox')).toBeVisible(); await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).not.toBeVisible(); note('원격 검색 활성 ID·선택·Escape'); return;
  }
  if (profile === 'date' || profile === 'time') {
    const input = page.locator('input[type="date"],input[type="time"]').first();
    if (await input.count()) {
      await tabTo(page, input); const value = await input.inputValue();
      // Chromium's ko-KR date input enters at the month segment; move once to the day within September's bounds.
      if (profile === 'date') await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowUp'); await expect(input).not.toHaveValue(value);
      note('브라우저 기본 날짜·시간 필드의 방향키 편집'); return;
    }
    const trigger = primary(page, d); await activate(page, trigger);
    if (profile === 'date') {
      const date = page.getByRole('button', { name: '2026-09-12', exact: true });
      await tabTo(page, date); await page.keyboard.press('ArrowRight'); await expect(date).not.toBeFocused();
      await page.keyboard.press('Enter'); await stateChanged(page, { date: '2026-09-12' });
    } else {
      const option = page.getByRole('option').first(); await expect(option).toBeVisible();
      // React moves DOM focus into its listbox; Vue keeps it on the combobox.
      if (d.platform === 'react') await expect.poll(() => page.getByRole('listbox').evaluate(node => node.contains(document.activeElement)),
        { message: '시간 선택 목록의 초기 포커스' }).toBe(true);
      await page.keyboard.press('ArrowDown'); const before = await snapshot(page); await page.keyboard.press('Enter');
      await stateChanged(page, before);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog').or(page.getByRole('listbox')).filter({ visible: true })).toHaveCount(0);
    note('날짜·시간 팝업 방향키 선택·Escape'); return;
  }
  if (profile === 'stepper') {
    const input = page.getByRole('spinbutton').or(page.getByRole('textbox')).first();
    await tabTo(page, input); await input.fill('4'); await page.keyboard.press('Enter');
    await expect(input).toHaveValue('4');
    const before = await snapshot(page); await activate(page, page.getByRole('button', { name: '수량 늘리기', exact: true }).first(), 'Space');
    await stateChanged(page, before); note('수량 편집·확정·증가'); return;
  }
  if (profile === 'table') {
    const checkbox = page.getByRole('checkbox').first(); await activate(page, checkbox, 'Space'); await expect(checkbox).toBeChecked();
    await activate(page, page.getByRole('button', { name: /행 확장|상세 보기/ }).nth(1));
    await expect(page.getByText(/상세:/).first()).toBeVisible(); note('행 선택·확장 키보드 실행'); return;
  }
  if (profile === 'data-state') {
    await activate(page, page.getByRole('button', { name: '조회 실패', exact: true }));
    await expect(page.getByText(/조회에 실패했습니다/).first()).toBeVisible();
    const before = await snapshot(page); await activate(page, page.getByRole('button', { name: /다시 시도|재시도/ }).first());
    await stateChanged(page, before); note('실패 안내·재시도'); return;
  }
  if (profile === 'link') {
    const target = primary(page, d);
    if (d.scenario.external && d.platform !== 'native') {
      const context = page.context(); await context.route('https://example.com/**', route => route.fulfill({ body: 'Observed external link' }));
      const request = context.waitForEvent('request', request => request.url().startsWith('https://example.com'));
      await activate(page, target); await request;
    } else {
      const before = await events(page); await activate(page, target);
      if (d.platform === 'native') await expect.poll(() => events(page)).toBeGreaterThan(before);
      else await expect(page).toHaveURL(/#home$/);
    }
    note('키보드 링크 목적지·콜백 실행'); return;
  }
  if (profile === 'tab-order') {
    for (const control of await controls(page).all()) { await tabTo(page, control); await expect(control).toBeFocused(); }
    note('공급한 모든 버튼의 Tab 순서'); return;
  }
  if (profile === 'remove' || profile === 'dismiss') {
    const target = primary(page, d); await activate(page, target, 'Space');
    if (profile === 'remove') await expect(page.getByRole('button', { name: '태그 복원' })).toBeVisible();
    else await expect(page.getByText('안내', { exact: true })).not.toBeVisible();
    note('닫기·삭제 키보드 실행'); return;
  }
  let target = primary(page, d);
  if (profile === 'choice') target = page.getByRole('button', { name: '체리', exact: true });
  if (profile === 'pagination') target = page.getByRole('button', { name: /다음/ }).first();
  if (profile === 'bottom-nav') target = page.getByRole('link', { name: /활동/ }).or(page.getByRole('button', { name: /활동/ })).first();
  if (profile === 'market') target = component === 'DsMarketCards' ? page.getByRole('button', { name: '변동', exact: true }) : controls(page).first();
  const before = await snapshot(page), eventCount = await events(page);
  await activate(page, target, ['checked', 'toggle', 'choice'].includes(profile) ? 'Space' : 'Enter');
  await expect.poll(() => events(page)).toBeGreaterThan(eventCount);
  await stateChanged(page, before);
  if (profile === 'button') {
    await expect.poll(async () => (await snapshot(page)).count).toBe(1);
    await page.keyboard.press('Space'); await expect.poll(async () => (await snapshot(page)).count).toBe(2);
  }
  if (profile === 'toggle') await expect(target).toHaveAttribute('aria-pressed', 'true');
  if (profile === 'checked') await expect(target).toBeChecked();
  note('키보드 활성화 콜백·상태 변경');
  const settings = await page.evaluate(() => window.__a11ySnapshot.settings);
  for (const key of ['disabled', 'loading'].filter(key => key in settings && !d.scenario.children && !d.scenario.separateAction && profile !== 'market')) {
    await configure(page, { [key]: true });
    const blocked = primary(page, d); await expect(blocked).toBeDisabled();
    const count = await events(page); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    expect(await events(page)).toBe(count); note(key + ' 실행 차단');
    await configure(page, { [key]: false });
  }
}
