import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import { addDays, moveDate, orderWeekdays, parseDate, todayIso, type CalendarDay, type WeekStart } from "../../../shared/package-runtime/calendar";
import {
  dayTone, eventDayLabel, holidayOf, isPast, periodDays, periodTitle, resolveMonth, resolveWeek, stepMonth, swipeStep, withinPeriod as within,
  type DayMarks as SharedDayMarks, type DaySpan as SharedDaySpan, type HolidayTest,
} from "../../../shared/package-runtime/event-calendar";
import { useSlide } from "../../../shared/package-runtime/use-slide";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Animated, PanResponder, Platform, View, type ColorValue, type StyleProp, type ViewStyle } from "react-native";
import { CalendarDayCell } from "./calendar-day";
import { KText, useReducedMotion } from "./internal";
import { motionIn, motionOut, nativeDriver } from "./motion";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export type { HolidayTest };
/** A bar over consecutive days; the colour is whatever the app passes. */
export type DaySpan<C = ColorValue> = SharedDaySpan<C>;
/** What a day shows under its number: the first span, an icon and up to three dots; count is spoken only. */
export type DayMarks<C = ColorValue> = SharedDayMarks<C>;

export interface KjunEventCalendarProps {
  /** A whole month (default) or one week. */
  view?: "month" | "week";
  /** The month shown, "YYYY-MM" (controlled; this month when missing or malformed). */
  month?: string;
  /** Asked for another month by a swipe, an outside day or (web) the keyboard; without it the month does not change. */
  onMonthChange?: (month: string) => void;
  /** Week view: any day of the week shown, "YYYY-MM-DD" (controlled; this week when missing). */
  week?: string;
  /** Asked for another week with that week's first day; without it the week does not change. */
  onWeekChange?: (week: string) => void;
  /** The picked day, "YYYY-MM-DD"; null picks nothing. Clearing it is up to the app. */
  value?: string | null;
  /** A day was pressed; the app decides whether it becomes the value. */
  onSelect?: (iso: string) => void;
  /** A long press on a day, also offered to screen readers as an action (Shift+Enter on the web); without it a hold is an ordinary press. */
  onDayLongPress?: (iso: string) => void;
  /** Names the long press action for screen readers, e.g. "이날 약속 추가". */
  dayLongPressLabel?: string;
  /** What a day shows under its number: the first span, an icon and up to three dots; count is spoken only. */
  marks?: (iso: string) => DayMarks | undefined;
  /** Holidays draw a danger number; a string also names the day for screen readers. */
  isHoliday?: HolidayTest;
  /** Fades the numbers and marks of days before today (default true); span bars keep their colour. */
  dimPast?: boolean;
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart?: WeekStart;
  /** Paints Sundays with the danger role (default true). */
  markSunday?: boolean;
  /** Paints Saturdays with the info role (default true). */
  markSaturday?: boolean;
  /** A horizontal swipe asks for the next or previous month or week (default true). On the web only touch swipes; mouse drags never do. */
  swipeable?: boolean;
  style?: StyleProp<ViewStyle>;
}

const calendar = tokens.extensions.calendar;
const web = Platform.OS === "web";
const data = (set: Record<string, string | number | boolean | undefined>) => web ? { dataSet: set } : {};
const isoOf = (target: EventTarget) => (target as Element).closest?.<HTMLElement>("[data-iso]")?.dataset.iso;
const weeksOf = (days: CalendarDay[]) => Array.from({ length: days.length / 7 }, (_, row) => days.slice(row * 7, row * 7 + 7));

/** A month or week of days that show events as dots, an icon and a span bar. It draws no card or heading. */
export function KjunEventCalendar({ view = "month", month, onMonthChange, week, onWeekChange, value = null, onSelect, onDayLongPress,
  dayLongPressLabel, marks, isHoliday, dimPast = true, weekStart = 0, markSunday = true, markSaturday = true, swipeable = true, style }: KjunEventCalendarProps) {
  const scope = useKjunMessageScope(), { colors } = useKjunStyles();
  const reduced = useReducedMotion();
  const today = todayIso();
  const key = view === "week" ? resolveWeek(week, weekStart, today) : resolveMonth(month, today);
  // The grid draws the shown month, so the old one stays while it slides out.
  const slide = useSlide(key, reduced), shown = slide.shown;
  const days = periodDays(shown, today, weekStart);
  const first = parseDate(shown.length === 7 ? shown + "-01" : shown)!;
  const labels = calendarLabels(first.year, first.month, scope);
  // The month, or the week's first and last day.
  const title = periodTitle(shown, scope);

  // Asks the app for the month (week) holding iso.
  const change = (iso: string) => view === "week" ? onWeekChange?.(resolveWeek(iso, weekStart)) : onMonthChange?.(iso.slice(0, 7));
  // The next or previous month (week), counted from the requested one so quick swipes add up.
  const step = (delta: -1 | 1) => change(view === "week" ? addDays(key, 7 * delta) : stepMonth(key, delta) + "-01");
  const canChange = view === "week" ? !!onWeekChange : !!onMonthChange;

  // Web keyboard, as the web packages: one tab stop, arrows and Page keys move the day and ask for the next period at the edge.
  const [focus, setFocus] = useState<string>();
  // The day a navigation key moved to: focus follows it once it is drawn in the shown period, however late the app applies the change.
  const focusWanted = useRef<string | null>(null);
  const gridNode = useRef<HTMLElement | null>(null);
  const tabStop = [focus, value, today].find(iso => !!iso && within(iso, shown)) ?? days.find(day => within(day.iso, shown))!.iso;
  useEffect(() => {
    const wanted = focusWanted.current;
    if (!web || !wanted) return;
    // Focus went somewhere else on the page: never pull it back.
    const active = document.activeElement;
    if (active && active !== document.body && !gridNode.current?.contains(active)) { focusWanted.current = null; return; }
    const target = gridNode.current?.querySelector<HTMLElement>(`[data-iso="${wanted}"]`);
    if (!target) return;
    if (active !== target) target.focus({ preventScroll: true });
    // An outside copy in the old month holds focus until the new period is drawn.
    if (within(wanted, shown)) focusWanted.current = null;
  });
  // Capture, because a pressable stops Enter from bubbling: Shift+Enter is taken before it would press the day.
  const onKeyDownCapture = (event: KeyboardEvent) => {
    focusWanted.current = null;
    gridNode.current = event.currentTarget as unknown as HTMLElement;
    const iso = isoOf(event.target);
    if (!iso) return;
    if (event.key === "Enter" && event.shiftKey) {
      if (onDayLongPress) { event.preventDefault(); event.stopPropagation(); onDayLongPress(iso); }
      return;
    }
    const next = moveDate(iso, event.key, event.shiftKey, weekStart);
    if (!next) return;
    event.preventDefault();
    if (!within(next, key)) { if (!canChange) return; change(next); }
    focusWanted.current = next;
    setFocus(next);
  };
  const latest = useRef({ swipeable, step });
  latest.current = { swipeable, step };
  // React Native Web presses on click, not through the responder: a press right after a swipe belongs to the swipe and is dropped.
  const swiped = useRef(false), guard = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pan = useMemo(() => {
    const end = () => { clearTimeout(guard.current); guard.current = setTimeout(() => { swiped.current = false; }, calendar.pressGuard); };
    // The step is decided when the move is claimed: the responder grant resets the gesture's dx and dy to zero.
    let claimed: -1 | 0 | 1 = 0;
    return PanResponder.create({
      // Only a clearly horizontal move is claimed, so an outer vertical scroll keeps its gestures.
      onMoveShouldSetPanResponder: (event, gesture) => {
        // React Native Web feeds mouse moves through the responder too; like the web packages, only touch swipes.
        const mouse = web && !String((event.nativeEvent as { type?: string }).type ?? "").startsWith("touch");
        claimed = latest.current.swipeable && !mouse ? swipeStep(gesture.dx, gesture.dy) : 0;
        return claimed !== 0;
      },
      // One swipe asks for one month (week); the rest of the gesture is ignored.
      onPanResponderGrant: () => {
        clearTimeout(guard.current);
        swiped.current = true;
        if (claimed) latest.current.step(claimed);
        claimed = 0;
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  }, []);
  useEffect(() => () => clearTimeout(guard.current), []);

  // The slide: the old period leaves toward the side it came from, the new one enters from the other; reduced motion never starts it.
  const shift = useRef(new Animated.Value(0)).current, fade = useRef(new Animated.Value(1)).current;
  // A layout effect, so a newly shown period takes its entering offset and fade before it paints, even when a quick change cut the exit short.
  useLayoutEffect(() => {
    if (slide.phase === "idle") { shift.setValue(0); fade.setValue(1); return; }
    const out = slide.phase === "out";
    if (!out) { shift.setValue(slide.direction * calendar.slideDistance); fade.setValue(0); }
    const timing = { duration: out ? calendar.slideOut : calendar.slideIn, easing: out ? motionIn : motionOut, useNativeDriver: nativeDriver };
    const animation = Animated.parallel([
      Animated.timing(shift, { ...timing, toValue: out ? -slide.direction * calendar.slideDistance : 0 }),
      Animated.timing(fade, { ...timing, toValue: out ? 0 : 1 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [slide.phase, slide.direction, shown]);

  const pick = (day: CalendarDay) => {
    if (swiped.current) return;
    focusWanted.current = null;
    setFocus(day.iso);
    onSelect?.(day.iso);
    // An outside day picks first, then brings its month.
    if (day.outside) onMonthChange?.(day.iso.slice(0, 7));
  };
  const moving = slide.phase !== "idle";

  return (
    <View style={style} {...data({ view, swipeable: swipeable || undefined })}>
      <View style={{ flexDirection: "row" }}>
        {orderWeekdays(labels.weekdays, weekStart).map((name, index) => {
          const tone = dayTone((index + weekStart) % 7, { markSunday, markSaturday, holiday: false });
          return <View key={index} aria-hidden={true} style={{ flex: 1, height: calendar.weekdayHeight, alignItems: "center", justifyContent: "center" }}>
            <KText {...data({ kjunPart: "weekday", tone: tone === "text" ? undefined : tone })}
              style={{ ...typeStyle("meta"), color: tone === "danger" ? colors.danger : tone === "info" ? colors.info : colors.textTertiary }}>{name}</KText>
          </View>;
        })}
      </View>
      <Animated.View {...(swipeable ? pan.panHandlers : {})} style={{ opacity: fade, transform: [{ translateX: shift }] }}
        // The group is named after the period on every platform; the web also marks it as a group.
        accessibilityLabel={title} {...(web ? { role: "group" as const, onKeyDownCapture } : {})}
        {...data({ kjunPart: "event-calendar-grid", slide: moving ? slide.phase : undefined, direction: moving ? slide.direction : undefined })}>
        {weeksOf(days).map(row => (
          <View key={row[0].iso} style={{ flexDirection: "row" }}>
            {row.map((day, column) => {
              const holiday = holidayOf(isHoliday, day.iso, scope);
              const mark = marks?.(day.iso);
              const past = dimPast && isPast(day.iso, today);
              return <CalendarDayCell key={day.iso} day={{ ...day, selected: day.iso === value }} density="comfortable" emphasis="event"
                tone={dayTone(day.weekday, { markSunday, markSaturday, holiday: holiday.holiday })} past={past}
                dim={day.outside ? calendar.outsideOpacity : past ? calendar.pastOpacity : undefined}
                label={eventDayLabel(day.iso, { holiday: holiday.name, count: mark?.count, today: day.today && !web }, scope)}
                tabIndex={day.iso === tabStop ? 0 : -1} keyShortcuts={onDayLongPress ? "Shift+Enter" : undefined}
                marks={mark} column={column} onPress={() => pick(day)}
                onLongPress={onDayLongPress ? () => onDayLongPress(day.iso) : undefined} longPressLabel={dayLongPressLabel} />;
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
