import { test, expect, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configureChoices = (page: Page, value: object) => page.evaluate(value => (window as any).configureChoices(value), value);
const configureTooltip = (page: Page, value: object) => page.evaluate(value => (window as any).configureTooltip(value), value);

test('native: choice Space executes once on release and cancels on blur or disabled', async ({ page }) => {
  await openFixture(page, 'native', '', 'accessibility-choices');
  const events = page.getByTestId('events');
  for (const [role, name, event] of [['checkbox', '알림 받기', 'checkbox'], ['switch', '자동 갱신', 'switch']] as const) {
    const control = page.getByRole(role, { name, exact: true });
    await control.focus();
    const before = JSON.parse((await events.textContent())!);
    await page.keyboard.down('Space'); await page.keyboard.down('Space');
    await expect(events).toHaveText(JSON.stringify(before));
    await page.keyboard.up('Space'); await expect(control).toBeChecked();
    await expect(events).toHaveText(JSON.stringify([...before, event + ':true']));
    await page.keyboard.down('Space'); await page.locator('#before-group').focus(); await page.keyboard.up('Space');
    await expect(control).toBeChecked();
    await control.focus(); await page.keyboard.down('Space');
    await configureChoices(page, { disabled: true }); await expect(control).toBeDisabled();
    await configureChoices(page, { disabled: false }); await expect(control).toBeEnabled();
    await page.keyboard.up('Space'); await expect(control).toBeChecked();
    await expect(events).toHaveText(JSON.stringify([...before, event + ':true']));
    await control.press('Space'); await expect(control).not.toBeChecked();
    await expect(events).toHaveText(JSON.stringify([...before, event + ':true', event + ':false']));
  }
  const array = page.getByRole('checkbox', { name: '배열 선택', exact: true });
  await array.press('Space'); await expect(array).toBeChecked();
  await array.press('Space'); await expect(array).not.toBeChecked();
});

test('native: radio single entry, arrows, controlled refusal, removal and group isolation', async ({ page }) => {
  await openFixture(page, 'native', '', 'accessibility-choices');
  const group = page.getByRole('radiogroup', { name: '과일', exact: true });
  await expect(group.locator('[role=radio][tabindex="0"]')).toHaveCount(1);
  await page.locator('#before-group').focus(); await page.keyboard.press('Tab');
  await expect(group.getByRole('radio', { name: '사과' })).toBeFocused();
  for (const [key, name] of [['ArrowRight', '체리'], ['ArrowDown', '대추'], ['ArrowRight', '사과'], ['ArrowLeft', '대추'], ['ArrowUp', '체리']]) {
    await page.keyboard.press(key); await expect(group.getByRole('radio', { name })).toBeFocused();
    await expect(group.getByRole('radio', { name })).toBeChecked();
  }
  await page.keyboard.press('Tab'); await expect(page.locator('#after-group')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(group.getByRole('radio', { name: '체리' })).toBeFocused();
  await configureChoices(page, { refuse: true });
  await page.keyboard.press('ArrowRight'); await expect(group.getByRole('radio', { name: '대추' })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(group.getByRole('radio', { name: '사과' })).toBeFocused();
  await expect(page.getByTestId('value')).toHaveText('c');
  await expect(group.locator('[role=radio][tabindex="0"]')).toHaveCount(1);
  await page.keyboard.press('Tab'); await expect(page.locator('#after-group')).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(group.getByRole('radio', { name: '체리' })).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(group.getByRole('radio', { name: '사과' })).toBeFocused();
  await page.keyboard.press('Shift+Tab'); await expect(page.locator('#before-group')).toBeFocused();
  await page.keyboard.press('Tab'); await expect(group.getByRole('radio', { name: '체리' })).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(group.getByRole('radio', { name: '사과' })).toBeFocused();
  await configureChoices(page, { options: [{ value: 'c', label: '체리' }, { value: 'd', label: '대추' }] });
  await expect(group.getByRole('radio', { name: '체리' })).toBeFocused();
  await configureChoices(page, { options: [{ value: 'c', label: '체리', disabled: true }] });
  await expect(group).toBeFocused(); await expect(group.locator('[role=radio][tabindex="0"]')).toHaveCount(0);
  await page.keyboard.press('Tab'); await expect(page.locator('#after-group')).toBeFocused();
  await configureChoices(page, { options: [] }); await expect(page.locator('#after-group')).toBeFocused();
  const children = page.getByRole('radiogroup', { name: '자식 라디오', exact: true });
  await page.keyboard.press('Tab'); await expect(children.getByRole('radio', { name: '자식 하나' })).toBeFocused();
  await page.keyboard.press('ArrowRight'); await expect(children.getByRole('radio', { name: '자식 둘' })).toBeFocused();
  await page.keyboard.press('Space'); await expect(children.getByRole('radio', { name: '자식 하나' })).toBeChecked();
});

test('vue2: tooltip descriptions preserve consumer IDs through updates, close and trigger replacement', async ({ page }) => {
  await openFixture(page, 'vue2', '', 'accessibility-tooltip');
  let trigger = page.getByRole('button', { name: '도움말', exact: true });
  await trigger.focus(); await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(trigger).toHaveAccessibleDescription('기존 도움말 이 버튼의 도움말');
  await configureTooltip(page, { description: 'second-help' });
  await expect(trigger).toHaveAccessibleDescription('새 도움말 이 버튼의 도움말');
  await page.keyboard.press('Escape'); await expect(page.getByRole('tooltip')).toHaveCount(0);
  await expect(trigger).toHaveAttribute('aria-describedby', 'second-help'); await expect(trigger).toBeFocused();
  await page.locator('#outside').focus(); await trigger.focus();
  await expect(trigger).toHaveAccessibleDescription('새 도움말 이 버튼의 도움말');
  await trigger.evaluate(node => { (window as any).oldTrigger = node; });
  await configureTooltip(page, { swapped: true });
  trigger = page.getByRole('button', { name: '다른 버튼', exact: true });
  await trigger.focus(); await expect(trigger).toHaveAccessibleDescription('새 도움말 이 버튼의 도움말');
  await expect.poll(() => page.evaluate(() => (window as any).oldTrigger.getAttribute('aria-describedby'))).toBe('second-help');
  await configureTooltip(page, { content: '' });
  await expect(page.getByRole('tooltip')).toHaveCount(0); await expect(trigger).toHaveAttribute('aria-describedby', 'second-help');
  await configureTooltip(page, { content: '변경된 설명' }); await page.locator('#outside').focus(); await trigger.focus();
  await expect(trigger).toHaveAccessibleDescription('새 도움말 변경된 설명');
  await configureTooltip(page, { mountedTooltip: false });
  await expect(trigger).toHaveAttribute('aria-describedby', 'second-help');
});
