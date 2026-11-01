import { expect, test, type Page } from '@playwright/test';
import { openFixture } from './packed-fixture';
const values = (page: Page) => page.getByTestId('values');
const day = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page, id: string) => page.getByTestId(id).getByRole('button', { name: id === 'date' ? /^시작일/ : /^사용 기간/ });
const open = async (page: Page, id: string) => { await field(page, id).click(); await expect(day(page, '월 선택')).toBeVisible(); };
// A closing calendar stays through its exit motion, so wait for it before opening the other field.
const close = async (page: Page) => { await page.keyboard.press('Escape'); await expect(day(page, '월 선택')).toHaveCount(0); };

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
    await page.getByTestId('range').getByRole('button', { name: '기간 지우기' }).click();
    await expect(values(page)).toHaveText('2026-09-12|/');
  });

  test(`${platform}: the footer Clear empties a range and Apply commits the empty range`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await open(page, 'range');
    await page.getByRole('button', { name: '기간 지우기' }).last().click();
    await expect(page.getByRole('button', { name: '적용' })).toBeEnabled();
    await page.getByRole('button', { name: '적용' }).click();
    await expect(values(page)).toHaveText('2026-09-12|/');
  });

  test(`${platform}: the heading opens months, then a grid of years`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await page.evaluate(() => (window as any).configureDates({ min: '2016-01-01' }));
    await open(page, 'date');
    await day(page, '월 선택').click();
    await day(page, '연도 선택').click();
    await expect(page.getByRole('button', { name: '2027', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: '2020', exact: true }).click();
    await page.getByRole('button', { name: '3월', exact: true }).click();
    await expect(day(page, '2020년 3월 12일 목요일')).toBeVisible();
  });

  test(`${platform}: the week can start on Monday and app rules block days`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await page.evaluate(() => (window as any).configureDates({ weekStart: 1, isDateUnavailable: (iso: string) => iso === '2026-09-15' }));
    await open(page, 'date');
    await expect(day(page, '2026년 8월 31일 월요일')).toBeVisible();
    await expect(day(page, '2026년 8월 30일 일요일')).toHaveCount(0);
    await expect(day(page, '2026년 9월 15일 화요일')).toBeDisabled();
    await day(page, '2026년 9월 15일 화요일').click({ force: true });
    await expect(values(page)).toHaveText('2026-09-12|2026-09-08/2026-09-16');
    await close(page);
    // A range cannot run across the blocked day: the second pick starts again there.
    await open(page, 'range');
    await day(page, '2026년 9월 14일 월요일').click();
    await day(page, '2026년 9월 18일 금요일').click();
    await expect(day(page, '2026년 9월 18일 금요일')).toHaveAttribute('aria-pressed', 'true');
    await expect(day(page, '2026년 9월 14일 월요일')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: '적용' })).toBeDisabled();
  });

  test(`${platform}: presets fill the range and autoApply commits on the second pick`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await page.evaluate(() => (window as any).configureDates({ presets: [{ label: '첫 주', value: { start: '2026-09-09', end: '2026-09-03' } }] }));
    await open(page, 'range');
    await page.getByRole('button', { name: '첫 주' }).click();
    await page.getByRole('button', { name: '적용' }).click();
    await expect(values(page)).toHaveText('2026-09-12|2026-09-03/2026-09-09');
    await page.evaluate(() => (window as any).configureDates({ autoApply: true }));
    await open(page, 'range');
    await expect(page.getByRole('button', { name: '적용' })).toHaveCount(0);
    await day(page, '2026년 9월 21일 월요일').click();
    await day(page, '2026년 9월 23일 수요일').click();
    await expect(values(page)).toHaveText('2026-09-12|2026-09-21/2026-09-23');
  });

  test(`${platform}: a 12-hour time shows 오후 and keeps HH:mm, and read-only does not open`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    const time = page.getByTestId('time');
    await expect(time.getByRole('button', { name: /^알림 시/ })).toContainText('13');
    await page.evaluate(() => (window as any).configureTime({ hourCycle: 12 }));
    const period = time.getByRole('button', { name: /^알림 오전\/오후/ });
    await expect(period).toContainText('오후');
    await expect(time.getByRole('button', { name: /^알림 시/ })).toContainText('01');
    await period.click();
    await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '오전' }).click();
    await expect(page.getByTestId('time-value')).toHaveText('01:30');
    await page.evaluate(() => (window as any).configureTime({ readOnly: true }));
    await period.click();
    await expect(page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '오후' })).toHaveCount(0);
    await expect(time.getByRole('button', { name: '알림 지우기' })).toHaveCount(0);
  });

  test(`${platform}: a time off the minute step stays editable`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await page.evaluate(() => (window as any).configureTime({ value: '09:07', minuteStep: 5 }));
    const minute = page.getByTestId('time').getByRole('button', { name: /^알림 분/ });
    await expect(minute).toBeEnabled();
    await minute.click();
    await page.getByRole(platform === 'native' ? 'radio' : 'option', { name: '10' }).click();
    await expect(page.getByTestId('time-value')).toHaveText('09:10');
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

  test(`${platform}: the month buttons keep keyboard focus, and range days describe their part`, async ({ page }) => {
    await openFixture(page, platform, '', 'date-picker-design');
    await open(page, 'date');
    await day(page, '다음 달').focus();
    await page.keyboard.press('Enter');
    // October is the last month inside the bounds, so its turned-off button hands focus to the other one.
    await expect(day(page, '2026년 10월 12일 월요일')).toBeVisible();
    await expect(day(page, '이전 달')).toBeFocused();
    await expect(page.locator('.kjun-calendar [aria-live="polite"]')).toHaveText('2026년 10월');
    await page.keyboard.press('Enter');
    await expect(day(page, '다음 달')).toBeFocused();
    await expect(day(page, '2026년 9월 12일 토요일')).toBeVisible();
    await expect(values(page)).toHaveText('2026-09-12|2026-09-08/2026-09-16');
    await close(page);
    await open(page, 'range');
    await expect(day(page, '2026년 9월 8일 화요일')).toHaveAccessibleDescription('시작일');
    await expect(day(page, '2026년 9월 10일 목요일')).toHaveAccessibleDescription('선택한 기간');
    await day(page, '2026년 9월 20일 일요일').click();
    await expect(page.locator('.kjun-calendar [aria-live="polite"]')).toHaveText('종료일을 선택하세요');
    // Before the end is picked, hovering a later day previews the band.
    await day(page, '2026년 9월 23일 수요일').hover();
    await expect(day(page, '2026년 9월 22일 화요일')).toHaveAttribute('data-in-range', 'true');
  });
}
