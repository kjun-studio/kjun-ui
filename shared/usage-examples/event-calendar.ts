import { expr, type UsageBuilder } from './builder';

/** KjunEventCalendar usage: a month with marks, a week in a card, and a long press that adds. The title row and its buttons are the app's. */
export function eventCalendar(b: UsageBuilder, s: Record<string, any>): string {
  const week = s.view === 'week', action = b.native ? 'onPress' : 'onClick', row = b.native ? 'View' : 'div';
  if (b.native) b.declare('appColors', 'import { appColors } from "./kjun";');
  // The app owns the mark colors: CSS variables on the web, the app's own colors on Native.
  const color = (role: string) => b.native ? `appColors.${role}` : `"var(--kjun-${role})"`;
  b.declare('events', `// Each event passes its own color; an event that spans days keeps the same bar across its whole period.
const events = [
  { start: "2026-11-03", end: "2026-11-03", color: ${color('success')} },
  { start: "2026-11-08", end: "2026-11-08", color: ${color('brand')} },
  { start: "2026-11-08", end: "2026-11-08", color: ${color('warning')} },
  { start: "2026-11-10", end: "2026-11-10", color: ${color('brand')}, icon: "heart" },
  { start: "2026-11-12", end: "2026-11-14", color: ${color('warning')}, bar: true },
];
const holidays = { "2026-11-05": "임시 휴일" };`);
  b.declare('titleOf', 'const titleOf = (iso) => iso.slice(0, 4) + "년 " + Number(iso.slice(5, 7)) + "월";');
  if (week) b.declare('shiftWeek', `function shiftWeek(iso, delta) {
  const date = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)) + 7 * delta);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}`);
  else b.declare('shiftMonth', `function shiftMonth(month, delta) {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + delta, 1);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}`);
  const added = !!s.longPress && !week;
  // The marks of one day; a function (not a handler) so Vue binds it as a prop.
  b.handler('marksOf', 'iso', `const onDay = events.filter(event => event.start <= iso && iso <= event.end);
const bar = onDay.find(event => event.bar);
const icon = onDay.find(event => event.icon);
return {
  spans: bar ? [{ color: bar.color, start: bar.start, end: bar.end }] : undefined,
  icon: icon ? { name: icon.icon, color: icon.color } : undefined,
  dots: [...onDay.filter(event => !event.bar && !event.icon).map(event => event.color)${added ? ', ...state.added.filter(day => day === iso).map(() => ' + color('brand') + ')' : ''}],
  count: onDay.length${added ? ' + state.added.filter(day => day === iso).length' : ''},
};`);
  b.handler('holidayOf', 'iso', 'return holidays[iso] ?? false;');
  const inline = (code: string) => b.vue ? `{{ ${code} }}` : `{${code}}`;
  const step = (name: string, label: string, icon: string, call: string) => b.node('KjunButton', { variant: 'ghost', shape: 'circle', prefixIcon: icon, ariaLabel: label,
    [action]: b.handler(name, '', b.set(week ? 'week' : 'month', call)) });
  const prop = (key: string, fallback: boolean) => s[key] === fallback || s[key] === undefined ? {} : { [key]: s[key] };
  const calendar = b.node('KjunEventCalendar', {
    ...(week ? { view: 'week', week: b.state('week', '2026-11-18'), onWeekChange: b.update('week') } : { month: b.state('month', '2026-11'), onMonthChange: b.update('month') }),
    ...(b.vue ? { value: b.state('picked', null), onValueChange: b.update('picked') } : { value: b.state('picked', null), onSelect: b.handler('pick', 'iso', b.set('picked', 'iso')) }),
    marks: expr('marksOf'), isHoliday: expr('holidayOf'), ...prop('dimPast', true), ...prop('markSaturday', true), ...prop('swipeable', true),
    ...(s.weekStart === '월요일' ? { weekStart: 1 } : {}),
    ...(added ? { dayLongPressLabel: '이날 약속 추가', onDayLongPress: b.handler('addAppointment', 'iso', b.set('added', '[...state.added, iso]')) } : {}),
  });
  if (added) b.state('added', []);
  const status = b.node('KjunText', { tone: 'secondary' }, inline(added ? '(state.added.length ? "약속을 추가한 날: " + state.added.join(", ") : "날짜를 길게 눌러 약속을 추가해 보세요.")' : '"고른 날: " + (state.picked || "없음")'));
  if (week) {
    const nav = b.node(row, { style: b.native ? { flexDirection: 'row' } : { display: 'flex' } }, [step('previousWeek', '이전 주', 'chevron-left', 'shiftWeek(state.week, -1)'), step('nextWeek', '다음 주', 'chevron-right', 'shiftWeek(state.week, 1)')].join('\n'));
    return b.group([b.node('KjunCard', { title: expr('titleOf(state.week)') }, calendar, { headerActions: nav }), status]);
  }
  const head = b.node(row, { style: b.native ? { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } : { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } }, [
    step('previousMonth', '이전 달', 'chevron-left', 'shiftMonth(state.month, -1)'), b.node('KjunText', { variant: 'cardTitle' }, inline('titleOf(state.month + "-01")')), step('nextMonth', '다음 달', 'chevron-right', 'shiftMonth(state.month, 1)')].join('\n'));
  return b.group([head, calendar, status]);
}
