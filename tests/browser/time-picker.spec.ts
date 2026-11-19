import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunTimePicker: segments (or a one-line button) open a wheel of hour, minute (and second, AM/PM) columns in a popover
// or a bottom sheet; the wheel turns a draft that the confirm button commits. layout="inline" shows the wheel in place and
// commits each stop. Digits typed on a segment pick its value and move on once the segment is full.
const value = (page: Page, id: string) => page.getByTestId(id + '-value');
const commits = async (page: Page, id: string) => JSON.parse(await page.getByTestId(id + '-commits').textContent() || '[]');
// Wheel columns are named by their unit alone; the field's segments carry the field's name first. The inline case's wheel
// sits on the page, so an opened wheel is the one inside the dialog.
const column = (page: Page, name: string) => page.getByRole('dialog').getByRole('spinbutton', { name, exact: true });

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const segment = (page: Page, id: string, label: string, part: string) =>
      page.getByTestId(id).getByRole(platform === 'native' ? 'button' : 'spinbutton', { name: label + ' ' + part, exact: true });
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1400 });
      await openFixture(page, platform, '', 'time-picker');
    });

    test('a segment opens the wheel on its column; keys turn a draft that only confirm commits', async ({ page }) => {
      await segment(page, 'tp-basic', '알림', '분').click();
      await expect(column(page, '분')).toBeFocused();
      await page.keyboard.press('End');
      await expect(column(page, '분')).toHaveAttribute('aria-valuenow', '45');
      await page.keyboard.press('ArrowLeft');
      await expect(column(page, '시')).toBeFocused();
      await page.keyboard.press('Home');
      await expect(column(page, '시')).toHaveAttribute('aria-valuetext', '00');
      await expect(value(page, 'tp-basic')).toHaveText('none');
      await page.getByRole('button', { name: '확인', exact: true }).click();
      await expect(value(page, 'tp-basic')).toHaveText('00:45');
      expect(await commits(page, 'tp-basic')).toEqual(['00:45']);
      await expect(column(page, '분')).toHaveCount(0);
      await page.getByTestId('tp-basic').getByRole('button', { name: '알림 지우기' }).click();
      await expect(value(page, 'tp-basic')).toHaveText('none');
      if (platform !== 'native') await expect(segment(page, 'tp-basic', '알림', '시')).toBeFocused();
    });

    test('the open wheel reads hour:minute and fills the segment of the column in use', async ({ page }) => {
      await segment(page, 'tp-basic', '알림', '분').click();
      await expect(column(page, '분')).toBeFocused();
      // One ":" between the digit columns, none beside AM/PM.
      if (platform !== 'native') {
        await expect(page.getByRole('dialog').locator('.kjun-time-wheel-separator')).toHaveCount(1);
        const minute = segment(page, 'tp-basic', '알림', '분'), hour = segment(page, 'tp-basic', '알림', '시');
        await expect(minute).toHaveAttribute('data-active', 'true');
        await page.keyboard.press('ArrowLeft');
        await expect(hour).toHaveAttribute('data-active', 'true');
        await expect(minute).not.toHaveAttribute('data-active');
        await page.keyboard.press('Escape');
        await expect(hour).not.toHaveAttribute('data-active');
      } else await expect(page.getByRole('dialog').getByText(':', { exact: true })).toHaveCount(1);
    });

    test('scrolling a column settles on a row; Escape and cancel leave the value', async ({ page }) => {
      await segment(page, 'tp-twelve', '퇴근', '시').click();
      const minute = column(page, '분');
      await expect(minute).toHaveAttribute('aria-valuenow', '15');
      await minute.hover();
      await page.mouse.wheel(0, 44 * 3);
      await expect(minute).toHaveAttribute('aria-valuenow', '18');
      await page.getByRole('button', { name: '취소', exact: true }).click();
      await expect(value(page, 'tp-twelve')).toHaveText('13:15');
      await segment(page, 'tp-twelve', '퇴근', '오전/오후').click();
      await expect(column(page, '오전/오후')).toBeFocused();
      await expect(column(page, '오전/오후')).toHaveAttribute('aria-valuetext', '오후');
      await page.keyboard.press('ArrowDown');
      await expect(column(page, '오전/오후')).toHaveAttribute('aria-valuetext', '오전');
      await page.keyboard.press('Escape');
      await expect(column(page, '분')).toHaveCount(0);
      await expect(value(page, 'tp-twelve')).toHaveText('13:15');
      await expect(segment(page, 'tp-twelve', '퇴근', '오전/오후')).toBeFocused();
      // Enter in a column confirms like the button.
      await page.keyboard.press('Enter');
      await expect(column(page, '오전/오후')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(value(page, 'tp-twelve')).toHaveText('01:15');
    });

    test('min and max fade the hours and minutes outside them, and a stop there turns back', async ({ page }) => {
      await segment(page, 'tp-bounds', '영업', '시').click();
      const hour = column(page, '시'), minute = column(page, '분');
      await expect(hour).toBeFocused();
      await page.keyboard.press('End');
      await expect(hour).toHaveAttribute('aria-valuenow', '18');
      await page.keyboard.press('ArrowRight');
      // 18:30 is past max, so the minute column has nowhere to go.
      await page.keyboard.press('ArrowUp');
      await expect(minute).toHaveAttribute('aria-valuenow', '0');
      await page.keyboard.press('ArrowLeft');
      // ↑ from 18 goes round past the faded night hours to 09.
      await page.keyboard.press('ArrowUp');
      await expect(hour).toHaveAttribute('aria-valuenow', '9');
      await page.getByRole('button', { name: '확인', exact: true }).click();
      await expect(value(page, 'tp-bounds')).toHaveText('09:00');
    });

    test('digits typed on a segment pick it and move to the next one; ↑ and ↓ step it', async ({ page }) => {
      const hour = segment(page, 'tp-basic', '알림', '시'), minute = segment(page, 'tp-basic', '알림', '분');
      await hour.focus();
      await page.keyboard.press('1');
      await expect(value(page, 'tp-basic')).toHaveText('01:00');
      await expect(hour).toBeFocused();
      await page.keyboard.press('4');
      await expect(value(page, 'tp-basic')).toHaveText('14:00');
      await expect(minute).toBeFocused();
      // The minute steps by 15: "3" alone is no minute, "30" is.
      await page.keyboard.press('3');
      await expect(value(page, 'tp-basic')).toHaveText('14:00');
      await page.keyboard.press('0');
      await expect(value(page, 'tp-basic')).toHaveText('14:30');
      await page.keyboard.press('ArrowUp');
      await expect(value(page, 'tp-basic')).toHaveText('14:45');
      await page.keyboard.press('ArrowUp');
      await expect(value(page, 'tp-basic')).toHaveText('14:00');
      await expect(column(page, '분')).toHaveCount(0);
      // a/p switches a 12-hour clock's AM/PM segment.
      await segment(page, 'tp-twelve', '퇴근', '오전/오후').focus();
      await page.keyboard.press('a');
      await expect(value(page, 'tp-twelve')).toHaveText('01:15');
    });

    test('read-only shows the time without a wheel, typing or a clear button', async ({ page }) => {
      const hour = segment(page, 'tp-readonly', '고정', '시');
      await hour.click();
      await expect(column(page, '시')).toHaveCount(0);
      await hour.focus();
      await page.keyboard.press('3');
      await expect(value(page, 'tp-readonly')).toHaveText('08:00');
      await expect(page.getByTestId('tp-readonly').getByRole('button', { name: '고정 지우기' })).toHaveCount(0);
    });

    test('the sheet opens from a one-line button that reads the 12-hour time', async ({ page }) => {
      const field = page.getByTestId('tp-sheet').getByRole('button', { name: /^취침/ }).first();
      await expect(field).toContainText('오후 9:30');
      // A field that hugs its time puts the clear button near its middle, so press the time itself.
      await field.getByText('오후 9:30').click();
      const sheet = page.getByRole('dialog', { name: '취침' });
      await expect(sheet).toBeVisible();
      await expect(column(page, '오전/오후')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowUp');
      await sheet.getByRole('button', { name: '확인', exact: true }).click();
      await expect(value(page, 'tp-sheet')).toHaveText('09:35');
      await expect(field).toContainText('오전 9:35');
    });

    test('an inline wheel commits each stop without a field or confirm', async ({ page }) => {
      const minute = page.getByTestId('tp-inline').getByRole('spinbutton', { name: '분', exact: true });
      await expect(minute).toHaveAttribute('aria-valuenow', '30');
      await minute.focus();
      await page.keyboard.press('ArrowUp');
      await expect(value(page, 'tp-inline')).toHaveText('09:35');
      // Let the column finish its smooth turn to 35 before the wheel moves it on.
      await page.waitForTimeout(600);
      await minute.hover();
      await page.mouse.wheel(0, 44 * 2);
      await expect(value(page, 'tp-inline')).toHaveText('09:45');
      expect(await commits(page, 'tp-inline')).toEqual(['09:35', '09:45']);
      await expect(page.getByRole('button', { name: '확인', exact: true })).toHaveCount(0);
    });

    if (platform !== 'native') test('id lets an outside label reach the first segment', async ({ page }) => {
      await page.getByText('출발 시각').click();
      await expect(column(page, '시')).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(segment(page, 'tp-label', '출발', '시')).toBeFocused();
      await expect(segment(page, 'tp-label', '출발', '시')).toHaveAttribute('id', 'tp-outside');
    });
  });
}
