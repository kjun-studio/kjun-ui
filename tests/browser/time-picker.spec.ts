import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';

// KjunTimePicker: one Select per segment (hour, minute, optional second and AM/PM). Choosing or typing in a segment
// changes the whole "HH:mm" value; digits typed on a segment pick its value and move on once the segment is full.
const segment = (page: Page, id: string, label: string, part: string) => page.getByTestId(id).getByRole('button', { name: label + ' ' + part, exact: true });
const value = (page: Page, id: string) => page.getByTestId(id + '-value');
const commits = async (page: Page, id: string) => JSON.parse(await page.getByTestId(id + '-commits').textContent() || '[]');

for (const platform of ['react', 'vue3', 'native']) {
  test.describe(platform, () => {
    const option = (page: Page, name: string) => page.getByRole(platform === 'native' ? 'radio' : 'option', { name, exact: true });
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 1400 });
      await openFixture(page, platform, '', 'time-picker');
    });

    test('choosing segments builds the time, and clearing empties it and returns focus', async ({ page }) => {
      await segment(page, 'tp-basic', '알림', '시').click();
      await option(page, '09').click();
      await expect(value(page, 'tp-basic')).toHaveText('09:00');
      await segment(page, 'tp-basic', '알림', '분').click();
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(4);
      await option(page, '45').click();
      await expect(value(page, 'tp-basic')).toHaveText('09:45');
      expect(await commits(page, 'tp-basic')).toEqual(['09:00', '09:45']);
      await page.getByTestId('tp-basic').getByRole('button', { name: '알림 지우기' }).click();
      await expect(value(page, 'tp-basic')).toHaveText('none');
      if (platform !== 'native') await expect(segment(page, 'tp-basic', '알림', '시')).toBeFocused();
    });

    test('digits typed on a segment pick it and move to the next one', async ({ page }) => {
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
      await expect(page.getByRole('listbox')).toHaveCount(0);
    });

    test('a 12-hour clock switches AM/PM by choice or by a/p and keeps a 24-hour value', async ({ page }) => {
      await expect(segment(page, 'tp-twelve', '퇴근', '시')).toContainText('01');
      await segment(page, 'tp-twelve', '퇴근', '오전/오후').click();
      await option(page, '오전').click();
      await expect(value(page, 'tp-twelve')).toHaveText('01:15');
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(0);
      // Choosing returns focus to the segment; typing starts once it is back.
      await expect(segment(page, 'tp-twelve', '퇴근', '오전/오후')).toBeFocused();
      await page.keyboard.press('p');
      await expect(value(page, 'tp-twelve')).toHaveText('13:15');
      await expect(segment(page, 'tp-twelve', '퇴근', '시')).toBeFocused();
      await page.keyboard.press('1');
      await page.keyboard.press('2');
      await expect(value(page, 'tp-twelve')).toHaveText('12:15');
    });

    test('min, max and the step limit the offered hours and minutes', async ({ page }) => {
      await segment(page, 'tp-bounds', '영업', '시').click();
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(10);
      await option(page, '18').click();
      await expect(value(page, 'tp-bounds')).toHaveText('18:00');
      await segment(page, 'tp-bounds', '영업', '분').click();
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(1);
    });

    test('read-only shows the time without lists, typing or a clear button', async ({ page }) => {
      const hour = segment(page, 'tp-readonly', '고정', '시');
      await hour.click();
      await expect(page.getByRole(platform === 'native' ? 'radio' : 'option')).toHaveCount(0);
      await hour.focus();
      await page.keyboard.press('3');
      await expect(value(page, 'tp-readonly')).toHaveText('08:00');
      await expect(page.getByTestId('tp-readonly').getByRole('button', { name: '고정 지우기' })).toHaveCount(0);
    });

    if (platform !== 'native') test('id lets an outside label reach the first segment', async ({ page }) => {
      await page.getByText('출발 시각').click();
      await expect(page.getByRole('listbox')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(segment(page, 'tp-label', '출발', '시')).toBeFocused();
      await expect(segment(page, 'tp-label', '출발', '시')).toHaveAttribute('id', 'tp-outside');
    });
  });
}
