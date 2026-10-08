import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const configureButton = (page: Page, next: object) => page.evaluate(next => (window as any).configureButton(next), next);
const button = (page: Page) => page.getByTestId('text').getByRole('button').first();
for (const platform of ['react', 'vue2', 'native']) {
  test(`${platform}: press, cancellation and becoming unavailable never execute a stale action`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, platform, '', 'button-design');
    const control = button(page), events = page.getByTestId('events');
    const background = await control.evaluate(node => getComputedStyle(node).backgroundColor);
    await control.hover(); await expect(control).not.toHaveCSS('background-color', background);
    await expect(control).not.toHaveAttribute('aria-pressed'); await page.mouse.down();
    await expect(control).toHaveCSS('transform', 'matrix(0.98, 0, 0, 0.98, 0, 0)');
    await expect(events).toHaveText('0'); await page.mouse.up(); await expect(events).toHaveText('1');
    await control.hover(); await page.mouse.down(); await page.mouse.move(800, 600); await page.mouse.up();
    await expect(events).toHaveText('1');
    for (const state of ['disabled', 'loading']) {
      await control.hover(); await page.mouse.down();
      await configureButton(page, { [state]: true }); await expect(control).toBeDisabled();
      await expect(control).toHaveCSS('transform', platform === 'native' ? 'matrix(1, 0, 0, 1, 0, 0)' : 'none');
      await page.mouse.up(); await expect(events).toHaveText('1');
      await configureButton(page, { [state]: false }); await expect(control).toBeEnabled();
      await control.focus(); await page.keyboard.down('Space');
      await configureButton(page, { [state]: true }); await expect(control).toBeDisabled();
      await page.keyboard.up('Space'); await expect(events).toHaveText('1');
      await configureButton(page, { [state]: false }); await expect(control).toBeEnabled();
    }
    await control.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Space');
    await expect(events).toHaveText('3');
  });
  for (const initial of [false, true]) test(`${platform}: ${initial ? 'initial' : 'rendered'} loading minimum, restart and independent disabled`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-09-23T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-23T00:00:01Z'));
    await openFixture(page, platform, initial ? '?loading' : '', 'button-design');
    const control = button(page), before = await control.boundingBox();
    if (!initial) await configureButton(page, { loading: true });
    await expect(control).toHaveAttribute('aria-busy', 'true');
    await configureButton(page, { loading: false });
    await page.clock.runFor(390); await expect(control).toBeDisabled();
    await page.clock.runFor(20); await expect(control).toBeEnabled();
    expect(await control.boundingBox()).toEqual(before); await expect(control).toHaveAccessibleName('변경 사항 저장');
    await configureButton(page, { loading: true }); await expect(control).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(100); await configureButton(page, { loading: false });
    await page.clock.runFor(100); await configureButton(page, { loading: true });
    await page.clock.runFor(250); await configureButton(page, { loading: false, disabled: true });
    await page.clock.runFor(140); await expect(control).toHaveAttribute('aria-busy', 'true');
    await page.clock.runFor(20); await expect(control).not.toHaveAttribute('aria-busy', 'true');
    await expect(control).toBeDisabled();
    await configureButton(page, { disabled: false }); await expect(control).toBeEnabled();
    await control.click(); await expect(page.getByTestId('events')).toHaveText('1');
  });
  test(`${platform}: editing to readonly retains value and selection, blocks typing and clear`, async ({ page }) => {
    await openFixture(page, platform, '', 'input-design');
    const field = page.getByTestId('input').getByRole('textbox'), root = page.getByTestId('input');
    await field.fill('입력 중 변경'); await field.focus();
    const changes = await page.getByTestId('changes').textContent();
    await page.evaluate(() => (window as any).configureInputDesign({ readOnly: true }));
    await expect(field).toHaveAttribute('readonly'); await expect(field).toBeFocused();
    await page.keyboard.type('blocked'); await expect(field).toHaveValue('입력 중 변경');
    await field.evaluate((node: HTMLInputElement) => node.setSelectionRange(0, 2));
    expect(await field.evaluate((node: HTMLInputElement) => node.selectionEnd! - node.selectionStart!)).toBe(2);
    await expect(root.getByRole('button')).toBeDisabled();
    await root.getByRole('button').evaluate(node => (node as HTMLElement).click());
    await expect(page.getByTestId('changes')).toHaveText(changes!);
    await page.evaluate(() => (window as any).configureInputDesign({ readOnly: false }));
    await root.getByRole('button').click(); await expect(field).toHaveValue('');
    await field.fill('유지 값'); await page.evaluate(() => (window as any).configureInputDesign({ disabled: true, error: true }));
    await expect(field).toBeDisabled(); await expect(root.getByRole('button')).toBeDisabled();
    await page.getByTestId('input').evaluate(node => {
      const boundary = document.createElement('button'); boundary.id = 'disabled-entry-boundary';
      boundary.textContent = '입력 앞'; node.before(boundary); boundary.focus();
    });
    await page.keyboard.press('Tab'); await expect(field).not.toBeFocused();
    await expect(page.getByTestId('value')).toHaveText('유지 값');
    await page.evaluate(() => (window as any).configureInputDesign({ disabled: false }));
    await field.fill('새 값'); await expect(page.getByTestId('value')).toHaveText('새 값');
  });
}
