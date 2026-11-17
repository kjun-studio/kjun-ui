import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import { addDays, calendarDays, orderWeekdays, parseDate, todayIso, type CalendarDay, type WeekStart } from "../../../shared/package-runtime/calendar";
import {
  dayTone, eventDayLabel, holidayOf, isPast, resolveMonth, resolveWeek, stepMonth, swipeStep, weekDays,
  type DayMarks as SharedDayMarks, type DaySpan as SharedDaySpan, type HolidayTest,
} from "../../../shared/package-runtime/event-calendar";
import { useSlide } from "../../../shared/package-runtime/use-slide";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useMemo, useRef } from "react";
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
  /** Asked for another month by a swipe or an outside day; without it the month does not change. */
  onMonthChange?: (month: string) => void;
  /** Week view: any day of the week shown, "YYYY-MM-DD" (controlled; this week when missing). */
  week?: string;
  /** Asked for another week with that week's first day; without it the week does not change. */
  onWeekChange?: (week: string) => void;
  /** The picked day, "YYYY-MM-DD"; null picks nothing. Clearing it is up to the app. */
  value?: string | null;
  /** A day was pressed; the app decides whether it becomes the value. */
  onSelect?: (iso: string) => void;
  /** A long press on a day, also offered to screen readers as an action; without it a hold is an ordinary press. */
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
  /** A horizontal swipe asks for the next or previous month or week (default true). */
  swipeable?: boolean;
  style?: StyleProp<ViewStyle>;
}

const calendar = tokens.extensions.calendar;
const data = (set: Record<string, string | number | boolean | undefined>) => Platform.OS === "web" ? { dataSet: set } : {};
function daysOf(key: string, today: string, weekStart: WeekStart): CalendarDay[] {
  if (key.length !== 7) return weekDays(key, today);
  const [year, month] = key.split("-").map(Number);
  return calendarDays(year, month - 1, { today, weekStart, fixedWeeks: true });
}
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
  const days = daysOf(shown, today, weekStart);
  const first = parseDate(shown.length === 7 ? shown + "-01" : shown)!;
  const labels = calendarLabels(first.year, first.month, scope);
  // A week across two months names both.
  const last = shown.length === 7 ? first : parseDate(addDays(shown, 6))!;
  const title = last.month === first.month ? labels.title : labels.title + " – " + calendarLabels(last.year, last.month, scope).title;

  // Asks the app for the next or previous month (week), counted from the requested one so quick swipes add up.
  const step = (delta: -1 | 1) => view === "week" ? onWeekChange?.(resolveWeek(addDays(key, 7 * delta), weekStart)) : onMonthChange?.(stepMonth(key, delta));
  const latest = useRef({ swipeable, step });
  latest.current = { swipeable, step };
  // React Native Web presses on click, not through the responder: a press right after a swipe belongs to the swipe and is dropped.
  const swiped = useRef(false), guard = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pan = useMemo(() => {
    const end = () => { clearTimeout(guard.current); guard.current = setTimeout(() => { swiped.current = false; }, calendar.pressGuard); };
    return PanResponder.create({
      // Only a clearly horizontal move is claimed, so an outer vertical scroll keeps its gestures.
      onMoveShouldSetPanResponder: (_, gesture) => latest.current.swipeable && swipeStep(gesture.dx, gesture.dy) !== 0,
      // One swipe asks for one month (week); the rest of the gesture is ignored.
      onPanResponderGrant: (_, gesture) => {
        clearTimeout(guard.current);
        swiped.current = true;
        const delta = swipeStep(gesture.dx, gesture.dy);
        if (delta) latest.current.step(delta);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: end,
      onPanResponderTerminate: end,
    });
  }, []);
  useEffect(() => () => clearTimeout(guard.current), []);

  // The slide: the old period leaves toward the side it came from, the new one enters from the other; reduced motion never starts it.
  const shift = useRef(new Animated.Value(0)).current, fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
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
        {...(Platform.OS === "web" ? { role: "group" as const, "aria-label": title } : {})}
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
                label={eventDayLabel(day.iso, { holiday: holiday.name, count: mark?.count, today: day.today && Platform.OS !== "web" }, scope)}
                marks={mark} column={column} onPress={() => pick(day)}
                onLongPress={onDayLongPress ? () => onDayLongPress(day.iso) : undefined} longPressLabel={dayLongPressLabel} />;
            })}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}
