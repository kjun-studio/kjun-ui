import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunNumberInput: grouping, caret, paste, commit padding, sign, range errors, IME and field identity.
const field = (page: Page, id: string) => page.getByTestId(id).getByRole('textbox');
const value = (page: Page, id: string) => page.getByTestId(id + '-value');
const commit = (page: Page, id: string) => page.getByTestId(id + '-commit');
const caret = (page: Page, id: string) => field(page, id).evaluate(el => (el as HTMLInputElement).selectionStart);
const setCaret = (page: Page, id: string, at: number) => field(page, id).evaluate((el, at) => (el as HTMLInputElement).setSelectionRange(at, at), at);
// Every element aria-describedby points at, in order.
const described = (page: Page, id: string) => field(page, id).evaluate(el =>
  (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean).map(ref => document.getElementById(ref)?.textContent?.trim() ?? ''));

for (const platform of ['react', 'vue3']) {
  test.describe(platform, () => {
    test.beforeEach(async ({ page }) => {
      await openFixture(page, platform, '', 'number-input');
    });

    test('typing groups', async ({ page }) => {
      await field(page, 'amount').pressSequentially('1250000');
      await expect(field(page, 'amount')).toHaveValue('1,250,000');
      await expect(value(page, 'amount')).toHaveText('1250000');
      await expect(page.getByTestId('amount')).toContainText('125만 원');
    });

    test('caret survives regrouping', async ({ page }) => {
      await field(page, 'amount').pressSequentially('1234567');
      await expect(field(page, 'amount')).toHaveValue('1,234,567');
      await setCaret(page, 'amount', 5);
      await page.keyboard.type('9');
      await expect(field(page, 'amount')).toHaveValue('12,349,567');
      expect(await caret(page, 'amount')).toBe(6);
    });

    test('separator backspace', async ({ page }) => {
      await field(page, 'amount').pressSequentially('1234');
      await expect(field(page, 'amount')).toHaveValue('1,234');
      await setCaret(page, 'amount', 2);
      await page.keyboard.press('Backspace');
      await expect(field(page, 'amount')).toHaveValue('234');
      expect(await caret(page, 'amount')).toBe(0);
      await expect(value(page, 'amount')).toHaveText('234');
    });

    test('paste', async ({ page }) => {
      await field(page, 'amount').focus();
      await page.keyboard.insertText('₩1,234,000원');
      await expect(field(page, 'amount')).toHaveValue('1,234,000');
      await expect(value(page, 'amount')).toHaveText('1234000');
      await field(page, 'percent').focus();
      await page.keyboard.insertText('12.5%');
      await expect(field(page, 'percent')).toHaveValue('12.5');
      await expect(value(page, 'percent')).toHaveText('12.5');
    });

    test('commit pads', async ({ page }) => {
      await field(page, 'prefix').pressSequentially('3.5');
      await expect(field(page, 'prefix')).toHaveValue('3.5');
      await expect(value(page, 'prefix')).toHaveText('3.5');
      await field(page, 'prefix').press('Tab');
      await expect(field(page, 'prefix')).toHaveValue('3.50');
      await expect(commit(page, 'prefix')).toHaveText('3.50');
      await expect(value(page, 'prefix')).toHaveText('3.50');
    });

    test('grouping off and decimals cut', async ({ page }) => {
      await field(page, 'grouped-off').pressSequentially('1234567');
      await expect(field(page, 'grouped-off')).toHaveValue('1234567');
      await field(page, 'decimals').pressSequentially('12.345');
      await expect(field(page, 'decimals')).toHaveValue('12.3');
      await field(page, 'decimals').press('Enter');
      await expect(commit(page, 'decimals')).toHaveText('12.3');
    });

    test('leading dot', async ({ page }) => {
      await field(page, 'decimals').pressSequentially('.5');
      await expect(field(page, 'decimals')).toHaveValue('0.5');
      await expect(value(page, 'decimals')).toHaveText('0.5');
      expect(await caret(page, 'decimals')).toBe(3);
      await field(page, 'percent').pressSequentially('-.');
      await expect(field(page, 'percent')).toHaveValue('-0.');
      await field(page, 'percent').fill('');
      await field(page, 'percent').pressSequentially('.');
      await expect(field(page, 'percent')).toHaveValue('0.');
      await field(page, 'percent').press('Tab');
      await expect(field(page, 'percent')).toHaveValue('0.0');
      await expect(commit(page, 'percent')).toHaveText('0.0');
    });

    test('ime end after blur commits', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'IME composition is driven through the Chromium DevTools protocol.');
      const amount = field(page, 'amount');
      await amount.pressSequentially('12');
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.imeSetComposition', { text: 'ㅎ', selectionStart: 1, selectionEnd: 1 });
      // Blur while composing, then end the composition on the detached field.
      await amount.evaluate(el => { el.blur(); el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'ㅎ' })); });
      await expect(commit(page, 'amount')).toHaveText('12');
      await page.getByTestId('amount-set').click();
      await expect(amount).toHaveValue('777');
    });

    test('negative', async ({ page }) => {
      await field(page, 'percent').pressSequentially('3.5-');
      await expect(field(page, 'percent')).toHaveValue('-3.5');
      await expect(value(page, 'percent')).toHaveText('-3.5');
      await field(page, 'amount').pressSequentially('-');
      await expect(field(page, 'amount')).toHaveValue('');
      await expect(value(page, 'amount')).toHaveText('');
    });

    test('range error lifecycle', async ({ page }) => {
      const percent = field(page, 'percent');
      await percent.pressSequentially('120');
      await expect(percent).not.toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('percent')).not.toContainText('100% 이하로 입력해 주세요');
      await percent.press('Tab');
      await expect(percent).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('percent')).toContainText('100% 이하로 입력해 주세요');
      expect((await described(page, 'percent')).join(' ')).toContain('100% 이하로 입력해 주세요');
      await expect(percent).toHaveValue('120.0');
      await percent.fill('12');
      await expect(percent).toHaveValue('12');
      await expect(percent).not.toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('percent')).not.toContainText('100% 이하로 입력해 주세요');

      const grouped = field(page, 'group-error');
      await grouped.pressSequentially('99');
      await grouped.press('Tab');
      await expect(grouped).toHaveAttribute('aria-invalid', 'true');
      await expect(page.getByTestId('group-error')).toContainText('직접 오류');
      await expect(page.getByTestId('group-error')).not.toContainText('이하로 입력해 주세요');
    });

    test('escape restores', async ({ page }) => {
      const amount = field(page, 'amount');
      await amount.pressSequentially('1000');
      await amount.press('Enter');
      await expect(commit(page, 'amount')).toHaveText('1000');
      await amount.press('End');
      await page.keyboard.type('5');
      await expect(amount).toHaveValue('10,005');
      await amount.press('Escape');
      await expect(amount).toHaveValue('1,000');
      await expect(value(page, 'amount')).toHaveText('1000');
      await expect(commit(page, 'amount')).toHaveText('1000');
    });

    test('ime composition', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'IME composition is driven through the Chromium DevTools protocol.');
      const amount = field(page, 'amount');
      await amount.pressSequentially('12');
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.imeSetComposition', { text: 'ㅎ', selectionStart: 1, selectionEnd: 1 });
      await expect(amount).toHaveValue('12ㅎ');
      await expect(value(page, 'amount')).toHaveText('12');
      await cdp.send('Input.insertText', { text: '한' });
      await expect(amount).toHaveValue('12');
      await expect(value(page, 'amount')).toHaveText('12');
      await page.keyboard.type('3');
      await expect(amount).toHaveValue('123');
    });

    test('external value', async ({ page }) => {
      await field(page, 'amount').pressSequentially('5');
      await field(page, 'amount').press('Tab');
      await page.getByTestId('amount-set').click();
      await expect(field(page, 'amount')).toHaveValue('777');
      await page.getByTestId('prefix-set').click();
      await expect(field(page, 'prefix')).toHaveValue('777');
      await expect(field(page, 'disabled')).toHaveValue('1,234');
    });

    test('keyboard', async ({ page }) => {
      await expect(field(page, 'percent')).toHaveAttribute('inputmode', 'text');
      await expect(field(page, 'decimals')).toHaveAttribute('inputmode', 'decimal');
      await expect(field(page, 'amount')).toHaveAttribute('inputmode', 'numeric');
      const grouped = page.getByRole('textbox', { name: '보낼 금액' });
      await expect(grouped).toHaveCount(1);
      await grouped.pressSequentially('1250000');
      expect(await described(page, 'in-group')).toEqual(['125만 원', '잔액 3,420,000원']);
      await expect(field(page, 'disabled')).toBeDisabled();
    });

    test('geometry', async ({ page }) => {
      const read = (id: string) => field(page, id).evaluate(el => {
        const s = getComputedStyle(el);
        return { height: s.height, paddingLeft: s.paddingLeft, paddingRight: s.paddingRight, radius: s.borderRadius, numeric: s.fontVariantNumeric, align: s.textAlign };
      });
      const reference = await read('reference'), end = await read('end');
      expect(end.height).toBe(reference.height);
      expect(end.paddingLeft).toBe(reference.paddingLeft);
      expect(end.paddingRight).toBe(reference.paddingRight);
      expect(end.radius).toBe(reference.radius);
      expect(end.numeric).toContain('tabular-nums');
      expect(end.align).toBe('end');
      expect((await read('amount')).height).toBe(reference.height);
      expect((await read('amount')).align).not.toBe('end');
      const root = page.getByTestId('end').locator('.kjun-number-input');
      await expect(root).toHaveAttribute('data-format', 'amount');
      await expect(root).toHaveAttribute('data-align', 'end');
      await expect(page.getByTestId('percent').locator('.kjun-number-input')).toHaveAttribute('data-align', 'start');
    });
  });
}
