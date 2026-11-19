import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';

// event-calendar.ts reads the message folder, which Node cannot import directly, so the test bundles it.
const output = await build({ stdin: { contents: "export * from './shared/package-runtime/event-calendar.ts'; export { kjunMessagesEn } from './shared/package-runtime/messages';", resolveDir: '.', loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node',
  alias: { '@kjun-ui/tokens': './packages/tokens/src/index.ts' }, define: { 'process.env.NODE_ENV': '"production"' } });
const {
  resolveMonth, resolveWeek, stepMonth, weekDays, spanSegment, visibleDots, swipeStep, dayTone, holidayOf, isPast, eventDayLabel, slideStart, slideNext,
  withinPeriod, periodDays, periodTitle, kjunMessagesEn, kjunCalendarPeriod, resolveToday,
} = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('month and week fall back to today when malformed', () => {
  for (const bad of ['', '2026-13', 'x', undefined]) assert.equal(resolveMonth(bad, '2026-11-17'), '2026-11');
  assert.equal(resolveMonth('2026-05', '2026-11-17'), '2026-05');
  assert.equal(resolveWeek('2026-11-17', 0), '2026-11-15');
  assert.equal(resolveWeek('2026-11-17', 1), '2026-11-16');
  assert.equal(resolveWeek('nope', 0, '2026-11-17'), '2026-11-15');
  assert.equal(stepMonth('2026-12', 1), '2027-01');
  assert.equal(stepMonth('2026-01', -1), '2025-12');
});

test('a week spanning two months has no outside days', () => {
  const days = weekDays('2026-11-29', '2026-11-17');
  assert.deepEqual(days.map(d => d.iso), ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
  assert.ok(days.every(d => !d.outside));
});

test('span segments round only at the span ends and the week edges', () => {
  const span = { color: 'c', start: '2026-11-13', end: '2026-11-16' };
  assert.deepEqual(spanSegment(span, '2026-11-13', 5), { start: true, end: false });
  assert.deepEqual(spanSegment(span, '2026-11-14', 6), { start: false, end: true });
  assert.deepEqual(spanSegment(span, '2026-11-15', 0), { start: true, end: false });
  assert.deepEqual(spanSegment(span, '2026-11-16', 1), { start: false, end: true });
  assert.equal(spanSegment(span, '2026-11-17', 2), null);
  assert.equal(spanSegment({ color: 'c', start: '2026-11-16', end: '2026-11-13' }, '2026-11-14', 6), null);
});

test('marks are trimmed, never thrown on', () => {
  assert.deepEqual(visibleDots(['a', 'b', 'c', 'd', 'e', 'f', 'g']), ['a', 'b', 'c']);
  assert.deepEqual(visibleDots(undefined), []);
});

test('a swipe needs more than 20 across and more than twice the vertical travel', () => {
  assert.equal(swipeStep(-21, 0), 1); assert.equal(swipeStep(21, 10), -1);
  assert.equal(swipeStep(-20, 0), 0); assert.equal(swipeStep(-30, 15), 0); assert.equal(swipeStep(0, 80), 0);
});

test('day tone: holidays and Sundays are danger, Saturdays info', () => {
  const on = { markSunday: true, markSaturday: true, holiday: false };
  assert.equal(dayTone(0, on), 'danger'); assert.equal(dayTone(6, on), 'info'); assert.equal(dayTone(2, on), 'text');
  assert.equal(dayTone(2, { ...on, holiday: true }), 'danger');
  assert.equal(dayTone(6, { ...on, markSaturday: false }), 'text');
  assert.equal(dayTone(6, { ...on, holiday: true }), 'danger');
});

test('past days are strictly before today', () => {
  assert.equal(isPast('2026-11-16', '2026-11-17'), true);
  assert.equal(isPast('2026-11-17', '2026-11-17'), false);
});

test('the spoken name carries the holiday and the event count', () => {
  assert.equal(eventDayLabel('2026-11-10', { holiday: '창립기념일', count: 1 }), '2026년 11월 10일 화요일, 창립기념일, 일정 1개');
  for (const count of [0, -2, undefined]) assert.equal(eventDayLabel('2026-11-10', { count }), '2026년 11월 10일 화요일');
  assert.equal(eventDayLabel('2026-11-10', { count: 2.7 }), '2026년 11월 10일 화요일, 일정 2개');
  for (const count of [Infinity, NaN]) assert.equal(eventDayLabel('2026-11-10', { count }), '2026년 11월 10일 화요일');
  assert.equal(eventDayLabel('2026-11-10', { today: true, holiday: '창립기념일', count: 1 }), '2026년 11월 10일 화요일, 오늘, 창립기념일, 일정 1개');
  assert.deepEqual(holidayOf(() => true, '2026-11-10'), { holiday: true, name: '휴일' });
  assert.deepEqual(holidayOf(() => '창립기념일', '2026-11-10'), { holiday: true, name: '창립기념일' });
  assert.deepEqual(holidayOf(undefined, '2026-11-10'), { holiday: false });
});

test('a slide queues the newest month and always settles', () => {
  let s = { shown: '2026-11', pending: null, phase: 'idle', direction: 1 };
  s = slideStart(s, '2026-12'); assert.deepEqual([s.phase, s.direction, s.shown], ['out', 1, '2026-11']);
  s = slideStart(s, '2027-01'); // changed again mid-transition
  s = slideNext(s); assert.deepEqual([s.phase, s.shown], ['in', '2027-01']);
  s = slideNext(s); assert.deepEqual([s.phase, s.pending], ['idle', null]);
  assert.equal(slideStart(s, '2026-10').direction, -1);
  assert.equal(slideStart(s, '2027-01').phase, 'idle'); // same month: no transition
});

test('a slide that returns to the shown month settles without entering, and direction follows the final target', () => {
  let s = { shown: '2026-11', pending: null, phase: 'idle', direction: 1 };
  s = slideStart(s, '2026-12'); s = slideStart(s, '2026-11');
  s = slideNext(s); assert.deepEqual([s.phase, s.shown, s.pending], ['idle', '2026-11', null]);
  s = slideStart(s, '2026-12'); assert.equal(s.direction, 1);
  s = slideStart(s, '2026-09'); assert.equal(s.direction, -1);
  s = slideNext(s); assert.deepEqual([s.phase, s.shown], ['in', '2026-09']);
});

test('day cells carry no ring and the event calendar css ships', async () => {
  const css = await readFile('packages/tokens/src/calendar.css', 'utf8');
  assert.ok(!/today-ring/.test(css));
  assert.ok(!/\.kjun-calendar-(day|month)[^{]*\{[^}]*box-shadow/.test(css));
  assert.ok(JSON.parse(await readFile('shared/web-style-sources.json', 'utf8')).includes('event-calendar.css'));
  const event = await readFile('packages/tokens/src/event-calendar.css', 'utf8');
  const rules = text => [...text.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}@]+)\{([^{}]*)\}/g)].map(m => ({ selector: m[1].trim(), body: m[2] }));
  const bad = /(^|[;\s])(box-shadow|border(-(top|right|bottom|left))?(-(width|style|color))?)\s*:(?!\s*(0|none)\s*(;|$))/;
  for (const rule of [...rules(css).filter(r => /\.kjun-calendar-(day|month)/.test(r.selector)), ...rules(event)])
    assert.ok(!bad.test(rule.body), 'no shadow or border (a border: 0 reset is allowed): ' + rule.selector);
  assert.ok(!/:has\(/.test(event));
  assert.ok(/prefers-reduced-motion/.test(event) && /touch-action:\s*pan-y/.test(event));
});

test('a period: which days it holds, the days it draws and its name', () => {
  assert.ok(withinPeriod('2026-11-30', '2026-11') && !withinPeriod('2026-12-01', '2026-11'));
  assert.ok(withinPeriod('2026-12-05', '2026-11-29') && !withinPeriod('2026-12-06', '2026-11-29') && !withinPeriod('2026-11-28', '2026-11-29'));
  assert.equal(periodDays('2026-11', '2026-11-17', 0).length, 42);
  assert.deepEqual(periodDays('2026-11-29', '2026-11-17', 0).map(day => day.iso), ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
  assert.equal(periodTitle('2026-11'), '2026년 11월');
  assert.equal(periodTitle('2026-11-15'), '2026년 11월 15일 – 21일');
  assert.equal(periodTitle('2026-11-29'), '2026년 11월 29일 – 12월 5일');
  assert.equal(periodTitle('2026-12-27'), '2026년 12월 27일 – 2027년 1월 2일');
  const en = { messages: kjunMessagesEn, overrides: {}, language: 'en' };
  assert.equal(periodTitle('2026-11-15', en), 'November 15 – 21, 2026');
  assert.equal(periodTitle('2026-11-29', en), 'November 29 – December 5, 2026');
  assert.equal(periodTitle('2026-12-27', en), 'December 27, 2026 – January 2, 2027');
  // With an Intl locale the range is the runtime's own.
  const intl = periodTitle('2026-11-15', { ...en, intl: 'en-US' });
  assert.match(intl, /November 15\s*–\s*21, 2026/);
});

test('the hover square shows only where a pointer hovers', async () => {
  const css = (await readFile('packages/tokens/src/event-calendar.css', 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const hover = /:hover/g, media = css.indexOf('@media (hover: hover)');
  assert.ok(media >= 0);
  for (const match of css.matchAll(hover)) assert.ok(match.index > media, 'every :hover sits inside @media (hover: hover)');
});

test('kjunCalendarPeriod steps and names the period the app shows', () => {
  assert.equal(kjunCalendarPeriod.step('month', '2026-12', 1), '2027-01');
  assert.equal(kjunCalendarPeriod.step('month', '2026-01', -1), '2025-12');
  // A day as a month key reads as its month.
  assert.equal(kjunCalendarPeriod.step('month', '2026-11-18', 1), '2026-12');
  assert.equal(kjunCalendarPeriod.step('week', '2026-11-18', 1), '2026-11-22');
  assert.equal(kjunCalendarPeriod.step('week', '2026-11-18', -1, 1), '2026-11-09');
  assert.equal(kjunCalendarPeriod.title('month', '2026-11'), periodTitle('2026-11'));
  assert.equal(kjunCalendarPeriod.title('week', '2026-12-01'), periodTitle('2026-11-29'));
  assert.equal(kjunCalendarPeriod.title('week', '2026-12-01', { weekStart: 1 }), periodTitle('2026-11-30'));
  assert.match(kjunCalendarPeriod.title('month', '2026-11', { locale: 'en-US' }), /November 2026/);
});

test('the app may set today; a malformed one reads as the device today', () => {
  assert.equal(resolveToday('2026-02-03'), '2026-02-03');
  for (const bad of [undefined, '', '2026-02-30', 'today']) assert.match(resolveToday(bad), /^\d{4}-\d{2}-\d{2}$/);
  assert.notEqual(resolveToday('2026-02-30'), '2026-02-30');
});

test('loading fades the numbers of the days to come, never today, past or outside days', async () => {
  const css = (await readFile('packages/tokens/src/event-calendar.css', 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /\[data-loading\] \.kjun-calendar-day:not\(\[data-outside\], \[data-past\], \[data-today\]\) \.kjun-calendar-day-number \{ opacity: var\(--_kjun-extension-calendar-past-opacity\)/);
  assert.match(css, /\[data-loading\] \.kjun-calendar-day\[data-tone\]:not\([^)]*\) \.kjun-calendar-day-number \{ opacity: var\(--_kjun-extension-calendar-past-accent-opacity\)/);
  for (const platform of ['react', 'vue3', 'native']) {
    const source = await readFile(`packages/${platform}/src/event-calendar.tsx`, 'utf8');
    assert.match(source, platform === 'native' ? /loading \? \{ busy: true \}/ : /aria-busy=\{(props\.)?loading \|\| undefined\}/, platform);
    assert.match(source, /resolveToday\((props\.today|todayProp)\)/, platform);
  }
  const cell = await readFile('packages/native/src/calendar-day.tsx', 'utf8');
  assert.match(cell, /loading && !day\.today/);
});

test('Native Web hovers an event day like the web packages', async () => {
  const cell = await readFile('packages/native/src/calendar-day.tsx', 'utf8');
  assert.match(cell, /selected \? colors\.active : pressed \|\| hovered \? colors\.hover/);
});
