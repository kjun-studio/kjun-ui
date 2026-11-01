import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// calendar.ts reads the message folder, which Node cannot import directly, so the test bundles it.
const output = await build({ entryPoints: ['shared/package-runtime/calendar.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const {
  addMonths, calendarDays, calendarFooter, canApplyRange, monthOutside, moveDate, normalizeRange, orderWeekdays, parseDate,
  pickMonth, pickRange, rangeBand, rangeSubmitted, stepDisabled, stepTarget, toIsoDate, yearChoices, yearGrid, formatRange,
} = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('addMonths keeps the day inside the target month, leap years included', () => {
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2026-03-31', -1), '2026-02-28');
});

test('years below 100 stay as written', () => {
  assert.deepEqual(parseDate('0050-01-01'), { year: 50, month: 0, day: 1 });
  assert.equal(toIsoDate(50, 0, 1), '0050-01-01');
  assert.equal(parseDate('2026-02-30'), null);
});

test('calendarDays starts the week on weekStart and keeps real weekdays', () => {
  const sunday = calendarDays(2026, 8, { today: '2026-09-12' });
  assert.equal(sunday[0].iso, '2026-08-30');
  assert.equal(sunday[0].weekday, 0);
  const monday = calendarDays(2026, 8, { today: '2026-09-12', weekStart: 1 });
  assert.equal(monday[0].iso, '2026-08-31');
  assert.equal(monday[0].weekday, 1);
  assert.equal(monday.length % 7, 0);
  assert.deepEqual(orderWeekdays(['일', '월', '화', '수', '목', '금', '토'], 1), ['월', '화', '수', '목', '금', '토', '일']);
});

test('unavailable days are blocked inside the bounds', () => {
  const days = calendarDays(2026, 8, { today: '2026-09-12', unavailable: iso => iso === '2026-09-15' });
  assert.equal(days.find(day => day.iso === '2026-09-15').blocked, true);
  assert.equal(days.find(day => day.iso === '2026-09-16').blocked, false);
});

test('Home and End go to the ends of the week for any week start', () => {
  assert.equal(moveDate('2026-09-16', 'Home'), '2026-09-13');
  assert.equal(moveDate('2026-09-16', 'End'), '2026-09-19');
  assert.equal(moveDate('2026-09-16', 'Home', false, 1), '2026-09-14');
  assert.equal(moveDate('2026-09-16', 'End', false, 1), '2026-09-20');
  assert.equal(moveDate('2026-09-16', 'PageUp', true), '2025-09-16');
  assert.equal(moveDate('2026-09-16', 'Tab'), null);
});

test('a range previews its band from the start to the hovered day, in either direction', () => {
  assert.deepEqual(rangeBand({ start: '2026-09-10', end: '' }, '2026-09-14'), { start: '2026-09-10', end: '2026-09-14' });
  assert.deepEqual(rangeBand({ start: '2026-09-10', end: '' }, '2026-09-05'), { start: '2026-09-05', end: '2026-09-10' });
  assert.equal(rangeBand({ start: '2026-09-10', end: '' }), null);
  const days = calendarDays(2026, 8, { today: '2026-09-01', range: { start: '2026-09-10', end: '' }, preview: '2026-09-12' });
  assert.equal(days.find(day => day.iso === '2026-09-11').inRange, true);
  assert.equal(days.find(day => day.iso === '2026-09-12').rangeEnd, true);
});

test('pickRange orders the ends and restarts across an unavailable day', () => {
  assert.deepEqual(pickRange({ start: '2026-09-10', end: '' }, '2026-09-05'), { start: '2026-09-05', end: '2026-09-10' });
  assert.deepEqual(pickRange({ start: '2026-09-10', end: '' }, '2026-09-10'), { start: '2026-09-10', end: '2026-09-10' });
  const blocked = iso => iso === '2026-09-12';
  assert.deepEqual(pickRange({ start: '2026-09-10', end: '' }, '2026-09-14', blocked), { start: '2026-09-14', end: '' });
  assert.deepEqual(pickRange({ start: '2026-09-10', end: '' }, '2026-09-11', blocked), { start: '2026-09-10', end: '2026-09-11' });
});

test('Apply commits a whole range or an empty one, never a half', () => {
  assert.equal(canApplyRange({ start: '', end: '' }), true);
  assert.equal(canApplyRange({ start: '2026-09-10', end: '' }), false);
  assert.equal(canApplyRange({ start: '2026-09-10', end: '2026-09-11' }), true);
  assert.equal(rangeSubmitted({ start: '2026-09-10', end: '' }), '');
  assert.equal(rangeSubmitted({ start: '2026-09-10', end: '2026-09-11' }), '2026-09-10/2026-09-11');
});

test('normalizeRange orders, clamps and drops malformed ends', () => {
  assert.deepEqual(normalizeRange({ start: '2026-09-20', end: '2026-09-05' }), { start: '2026-09-05', end: '2026-09-20' });
  assert.deepEqual(normalizeRange({ start: '2026-08-01', end: '2026-12-01' }, '2026-09-03', '2026-10-20'), { start: '2026-09-03', end: '2026-10-20' });
  assert.deepEqual(normalizeRange({ start: 'soon', end: '2026-09-05' }), { start: '', end: '' });
  assert.deepEqual(normalizeRange(undefined), { start: '', end: '' });
});

test('the navigation buttons step by month, year or twelve years and stop at the bounds', () => {
  assert.equal(stepTarget('2026-09-12', 'days', 1), '2026-10-12');
  assert.equal(stepTarget('2026-09-12', 'months', -1), '2025-09-12');
  assert.equal(stepTarget('2026-09-12', 'years', 1), '2038-09-12');
  assert.equal(stepDisabled('2026-09-12', 'days', -1, '2026-09-03'), true);
  assert.equal(stepDisabled('2026-09-12', 'days', 1, '2026-09-03', '2026-10-20'), false);
  assert.equal(stepDisabled('2026-09-12', 'years', 1, undefined, '2027-06-01'), true);
  assert.equal(stepDisabled('2026-09-12', 'years', -1, '2000-01-01'), false);
  assert.equal(pickMonth('2026-01-31', 1), '2026-02-28');
  assert.deepEqual(yearGrid(2026), [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]);
});

test('month and year limits', () => {
  assert.equal(monthOutside(2026, 7, '2026-09-03'), true);
  assert.equal(monthOutside(2026, 8, '2026-09-03'), false);
  assert.deepEqual(yearChoices(2026, '2025-01-01', '2026-12-31'), [2025, 2026]);
  assert.deepEqual(yearChoices(2026), [2024, 2025, 2026, 2027, 2028]);
});

test('the footer shows Clear only when clearing is allowed', () => {
  assert.deepEqual(calendarFooter({ range: true, clearable: false, todayBlocked: false }), { clear: false, action: 'apply', shown: true });
  assert.deepEqual(calendarFooter({ range: false, clearable: false, todayBlocked: true }), { clear: false, action: null, shown: false });
  assert.deepEqual(calendarFooter({ range: false, clearable: true, todayBlocked: true }), { clear: true, action: null, shown: true });
  assert.deepEqual(calendarFooter({ range: true, apply: false, clearable: false, todayBlocked: false }), { clear: false, action: null, shown: false });
});

test('formatRange drops a repeated year only for the Korean format', () => {
  const ko = iso => iso.replace(/-/g, '. ') + '.';
  assert.equal(formatRange({ start: '2026-09-08', end: '2026-09-16' }, ko), '2026. 09. 08. – 09. 16.');
  assert.equal(formatRange({ start: '2026-09-08', end: '2026-09-16' }, iso => iso), '2026-09-08 – 2026-09-16');
  assert.equal(formatRange({ start: '2026-09-08', end: '' }, ko), '2026. 09. 08. –');
});
