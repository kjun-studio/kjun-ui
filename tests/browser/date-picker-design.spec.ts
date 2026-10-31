import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const values = (page: Page) => page.getByTestId('values');
const day = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page, id: string) => page.getByTestId(id).getByRole('button', { name: id === 'date' ? /^시작일/ : /^사용 기간/ });
const open = async (page: Page, id: string) => { await field(page, id).click(); await expect(day(page, '월 선택')).toBeVisible(); };

for (const platform of ['react', 'vue3', 'native']) {
  test(`${platform}: one KJUN calendar: round days, bounds, month view and picking a date`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await expect(page.getByTestId('date')).toContainText('2026. 09. 12.');
    await open(page, 'date');
    const selected = day(page, '2026년 9월 12일 토요일');
    await expect(selected).toHaveAttribute('aria-pressed', 'true');
    const box = (await selected.boundingBox())!;
    expect(Math.round(box.width)).toBe(40); expect(Math.round(box.height)).toBe(40);
    // Neighbouring months show faintly; the bounds block days and the previous month.
    await expect(day(page, '2026년 9월 2일 수요일')).toBeDisabled();
    await expect(day(page, '2026년 8월 30일 일요일')).toBeVisible();
    await expect(day(page, '이전 달')).toBeDisabled();
    await day(page, '다음 달').click();
    await expect(day(page, '2026년 10월 21일 수요일')).toBeDisabled();
    await expect(day(page, '다음 달')).toBeDisabled();
    // The heading opens the month view; a month outside the bounds cannot be chosen.
    await day(page, '월 선택').click();
    await expect(page.getByRole('button', { name: /^(12월|Dec)$/ })).toBeDisabled();
    await page.getByRole('button', { name: '9월', exact: true }).click();
    await day(page, '2026년 9월 15일 화요일').click();
    await expect(values(page)).toHaveText('2026-09-15|2026-09-08/2026-09-16');
    await expect(day(page, '월 선택')).toHaveCount(0);
    await expect(page.getByTestId('date')).toContainText('2026. 09. 15.');
  });

  test(`${platform}: a range picks its start and end, shows the band and applies`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await expect(page.getByTestId('range')).toContainText('2026. 09. 08. – 09. 16.');
    await open(page, 'range');
    await day(page, '2026년 9월 25일 금요일').click();
    await day(page, '2026년 9월 20일 일요일').click();
    // A second pick before the first swaps them into order.
    await expect(day(page, '2026년 9월 20일 일요일')).toHaveAttribute('aria-pressed', 'true');
    await expect(day(page, '2026년 9월 25일 금요일')).toHaveAttribute('aria-pressed', 'true');
    if (platform !== 'native') await expect(day(page, '2026년 9월 22일 화요일')).toHaveAttribute('data-in-range', 'true');
    await expect(values(page)).toHaveText('2026-09-12|2026-09-08/2026-09-16');
    await page.getByRole('button', { name: '적용' }).click();
    await expect(values(page)).toHaveText('2026-09-12|2026-09-20/2026-09-25');
    await expect(page.getByTestId('range')).toContainText('2026. 09. 20. – 09. 25.');
    // Closing without Apply keeps the committed range.
    await open(page, 'range');
    await day(page, '2026년 9월 5일 토요일').click();
    await page.keyboard.press('Escape');
    await expect(values(page)).toHaveText('2026-09-12|2026-09-20/2026-09-25');
    await page.getByTestId('range').getByRole('button', { name: '날짜 지우기' }).click();
    await expect(values(page)).toHaveText('2026-09-12|/');
  });

  test(`${platform}: disabled fields do not open`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await page.evaluate(() => (window as any).configureDates({ disabled: true }));
    await expect(field(page, 'date')).toBeDisabled();
    await field(page, 'date').click({ force: true });
    await expect(day(page, '월 선택')).toHaveCount(0);
  });
}

for (const platform of ['react', 'vue3']) {
  test(`${platform}: the calendar moves with arrows and pages and picks with Enter`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await field(page, 'date').focus();
    await page.keyboard.press('ArrowDown');
    await expect(day(page, '2026년 9월 12일 토요일')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(day(page, '2026년 9월 13일 일요일')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(day(page, '2026년 9월 20일 일요일')).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect(day(page, '2026년 10월 20일 화요일')).toBeFocused();
    // Moving past the last allowed day stops at it.
    await page.keyboard.press('ArrowRight');
    await expect(day(page, '2026년 10월 20일 화요일')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(values(page)).toHaveText('2026-10-20|2026-09-08/2026-09-16');
    await expect(field(page, 'date')).toBeFocused();
  });
}
