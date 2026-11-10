import { expect, test as base, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
    expect(errors).toEqual([]);
  }, { auto: true }],
});
const configure = (page: Page, next: object) => page.evaluate(next => (window as any).configurePropContract(next), next);
const warnings = (page: Page) => page.evaluate(() => (window as any).propContractWarnings as string[]);
const open = (page: Page, mode = 'development') => openFixture(page, 'vue3', '', 'prop-contracts', mode, false, true);

test('vue3: template aria-label, legacy ariaLabel and aria-labelledby name the actual toggle and tooltip', async ({ page }) => {
  await open(page);
  for (const [id, name] of [['attribute', 'Favorite'], ['alias', 'Favorite'], ['reference', 'Watch item']]) {
    const button = page.getByTestId(id);
    await expect(button).toHaveAccessibleName(name);
    await button.focus();
    await expect(page.getByRole('tooltip')).toHaveText(name);
    await page.keyboard.press('Escape');
  }
  await expect(page.getByTestId('attribute')).toHaveClass(/consumer-toggle/);
  await expect(page.getByTestId('attribute')).toHaveCSS('margin-top', '2px');
  await configure(page, { label: 'Unfavorite', referenced: 'Unwatch item' });
  await expect(page.getByTestId('reference')).toHaveAccessibleName('Unwatch item');
  await page.getByTestId('attribute').click();
  // Keep the original child-handler-before-fallthrough ordering, with each callback firing once.
  await expect(page.getByTestId('events')).toHaveText('[["toggle"],["click"]]');
  await page.mouse.move(1100, 700);
  await page.getByTestId('attribute').hover();
  await expect(page.getByRole('tooltip')).toHaveText('Unfavorite');
  expect(await warnings(page)).toEqual([]);
});

test('vue3: explicit/empty hints and disabled/loading toggles retain their behavior', async ({ page }) => {
  await open(page);
  await configure(page, { tooltip: 'Custom hint' });
  const button = page.getByTestId('attribute');
  await button.focus();
  await expect(page.getByRole('tooltip')).toHaveText('Custom hint');
  await configure(page, { tooltip: '' });
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  for (const state of [{ disabled: true }, { disabled: false, loading: true }]) {
    await configure(page, state);
    await expect(button).toBeDisabled();
    await expect(button).toHaveAccessibleName('Favorite');
    await expect(page.getByTestId('events')).toHaveText('[]');
  }
  expect(await warnings(page)).toEqual([]);
});

test('vue3: null mounts and parent resets display empty without emitting or submitting', async ({ page }) => {
  await open(page);
  const state = page.getByTestId('state'), events = page.getByTestId('events');
  await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  await expect(page.locator('.kjun-textarea-count')).toHaveText('0/20');
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Message' }).press('Control+Enter');
  await expect(state).toHaveText('{"input":null,"textarea":null,"date":null}');
  await expect(events).toHaveText('[]');
  await page.getByRole('button', { name: 'Date', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(events).toHaveText('[]');
  await configure(page, { input: 0, textarea: 'draft', date: '2026-09-10' });
  await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('0');
  await expect(page.locator('input[name="date"]')).toHaveValue('2026-09-10');
  await configure(page, { input: null, textarea: null, date: null });
  await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  expect(await page.locator('#date-form').evaluate(form => new FormData(form as HTMLFormElement).get('date'))).toBe('');
  await expect(events).toHaveText('[]');
  expect(await warnings(page)).toEqual([]);
});

test('vue3: typing, sending and clearing still emit strings after null', async ({ page }) => {
  await open(page);
  await page.getByRole('textbox', { name: 'Amount' }).fill('12');
  await page.getByTestId('input').getByRole('button').click();
  await page.getByRole('textbox', { name: 'Message' }).fill('Hello');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('textbox', { name: 'Message' }).fill('');
  await expect(page.getByTestId('events')).toHaveText('[["input","12"],["input",""],["textarea","Hello"],["submit","Hello"],["textarea",""]]');
  expect(await warnings(page)).toEqual([]);
});

test('vue3: selecting and clearing a date after null preserves string/change events', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Date', exact: true }).click();
  await page.getByRole('button', { name: '2026년 9월 15일 화요일', exact: true }).click();
  await expect(page.getByTestId('events')).toHaveText('[["date","2026-09-15"],["change","2026-09-15"]]');
  await page.locator('#date-form').getByRole('button', { name: '날짜 지우기', exact: true }).click();
  await expect(page.getByTestId('events')).toHaveText('[["date","2026-09-15"],["change","2026-09-15"],["date",""],["change",""]]');
  expect(await warnings(page)).toEqual([]);
});

for (const mode of ['development', 'production']) {
  test(`vue3: ${mode} exposes choices and only development warns for bad choices and missing names`, async ({ page }) => {
    const nameWarnings: string[] = [];
    page.on('console', message => { if (message.type() === 'warning' && message.text().includes('IconToggle needs')) nameWarnings.push(message.text()); });
    await open(page, mode);
    expect(await warnings(page)).toEqual([]);
    await configure(page, { invalid: true, unnamed: true });
    await expect(page.getByTestId('unnamed')).toBeVisible();
    await expect(page.getByTestId('validated')).toHaveAttribute('data-variant', 'invalid-variant');
    const actual = await warnings(page);
    if (mode === 'development') {
      expect(actual.some(message => message.includes('custom validator') && message.includes('variant'))).toBe(true);
      expect(nameWarnings).toHaveLength(1);
      await configure(page, { label: 'Updated' });
      expect(nameWarnings).toHaveLength(1);
    } else { expect(actual).toEqual([]); expect(nameWarnings).toEqual([]); }
    expect(await page.evaluate(() => (window as any).propContractValues.KjunInput.size)).toEqual(['sm', 'md', 'lg']);
  });
}
