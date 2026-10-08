import { expect } from './assert.mjs';
import { controls, openLayer, primary, tabTo } from './context.mjs';
import { feedbackFocus } from './services.mjs';
import { nativeSelectionFocus } from './native-selection.mjs';
export async function verifyFocus(page, d, note) {
  if (d.profile === 'feedback') return feedbackFocus(page, note);
  if (d.platform === 'native' && ['select', 'search', 'time'].includes(d.profile)) return nativeSelectionFocus(page, d, note);
  if (['dialog', 'menu'].includes(d.profile)) {
    const { trigger, layer } = await openLayer(page, d);
    await expect.poll(() => layer.evaluate(el => el.contains(document.activeElement)), { message: '열린 레이어의 초기 포커스' }).toBe(true);
    note('초기 포커스가 레이어 내부에 있음');
    if (d.profile === 'dialog') {
      const count = await layer.locator('button,input,textarea,select,[tabindex="0"]').count();
      for (let i = 0; i < count + 2; i++) {
        await page.keyboard.press('Tab');
        expect(await layer.evaluate(el => el.contains(document.activeElement)), 'Tab 포커스 제한').toBe(true);
      }
      await page.keyboard.press('Shift+Tab');
      expect(await layer.evaluate(el => el.contains(document.activeElement))).toBe(true);
      note('양방향 Tab이 대화상자 내부를 순환함');
    }
    await page.keyboard.press('Escape'); await expect(layer).not.toBeVisible();
    await expect(trigger).toBeFocused(); note('닫힌 뒤 원래 트리거로 복귀'); return;
  }
  const target = primary(page, d);
  await tabTo(page, target); await expect(target).toBeFocused();
  if (d.profile === 'field') {
    const before = await target.boundingBox();
    await page.evaluate(() => window.configureA11y({ error: '내용을 확인하세요' }));
    await expect(target).toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => target.evaluate(el => {
      const style = getComputedStyle(el);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
    }), { message: '오류 상태에서도 독립적인 포커스 테두리' }).toBe(true);
    const after = await target.boundingBox();
    expect({ width: after.width, height: after.height }).toEqual({ width: before.width, height: before.height });
    note('오류 상태의 포커스 테두리와 입력 크기 유지');
  }
  if (d.profile === 'tooltip') {
    await expect(page.getByRole('tooltip')).toBeVisible(); await expect(target).toBeFocused();
    await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).not.toBeVisible();
    await expect(target).toBeFocused(); note('도움말 표시·닫기 동안 트리거 포커스 유지'); return;
  }
  if (d.profile === 'select') {
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('listbox')).not.toBeVisible();
    await expect(target).toBeFocused(); note('선택 팝업 닫기 후 트리거·입력 복귀'); return;
  }
  const count = await controls(page).count();
  // Keep the next stop in the document: Firefox can retain activeElement when
  // Tab leaves the last control for browser chrome. This tests component exit,
  // independently of the browser's toolbar focus bookkeeping.
  await page.evaluate(() => {
    const next = document.createElement('button');
    next.dataset.a11yBoundary = 'next'; next.textContent = '다음 내용 (검사용)';
    document.body.append(next);
  });
  try {
    await page.keyboard.press('Tab');
    // Browser date/time controls contain several keyboard segments on one DOM input.
    if (d.profile === 'date') for (let i = 0; i < 4 && await target.evaluate(el => el === document.activeElement); i++) await page.keyboard.press('Tab');
    await expect(target).not.toBeFocused();
    await page.keyboard.press('Shift+Tab'); await expect(target).toBeFocused();
    note(`Tab 진입·다음 이동·Shift+Tab 복귀 (표시 컨트롤 ${count}개, 문서 내 다음 지점 추가)`);
  } finally { await page.locator('[data-a11y-boundary="next"]').evaluate(node => node.remove()); }
}
