import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  calendarDays, calendarFooter, canApplyRange, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, moveDate, orderWeekdays,
  parseDate, pickMonth, pickYear, rangeRole, stepDisabled, stepTarget, todayIso, toIsoDate, yearGrid, yearOutside,
  type CalendarMode, type DateRange, type DateUnavailable, type RangeLimits, type WeekStart,
} from "../../../shared/package-runtime/calendar";
import { dayTone } from "../../../shared/package-runtime/event-calendar";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, findNodeHandle, Platform, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton, KjunIcon } from "./button";
import { CalendarDayCell } from "./calendar-day";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export interface CalendarOptions {
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart?: WeekStart;
  /** Paints Sundays with the danger role, as Korean calendars do (default true). */
  markSunday?: boolean;
  /** Paints Saturdays with the info role (default true). */
  markSaturday?: boolean;
  /** Days that cannot be picked inside the bounds, such as holidays; a range cannot run across one. */
  isDateUnavailable?: DateUnavailable;
}
/** A named range offered as a chip, such as "최근 7일". */
export interface DateRangePreset { label: string; value: DateRange }
export interface CalendarViewProps extends CalendarOptions {
  value?: string;
  range?: DateRange;
  min?: string;
  max?: string;
  clearable?: boolean;
  onSelect: (iso: string) => void;
  onClear?: () => void;
  /** Range mode: the footer applies the picked range instead of jumping to today. */
  onApply?: () => void;
  /** Range mode: ready-made ranges shown as chips above the days. */
  presets?: readonly DateRangePreset[];
  onPreset?: (range: DateRange) => void;
  /** Range mode: the shortest and longest range while the end is picked. */
  limits?: RangeLimits;
}
/** KJUN's calendar, as on Web: a day grid, and month and year views opened from the heading. */
export function CalendarView({ value, range, min, max, clearable = false, weekStart = 0, markSunday = true, markSaturday = true, isDateUnavailable,
  onSelect, onClear, onApply, presets, onPreset, limits }: CalendarViewProps) {
  const scope = useKjunMessageScope(), m = scope.messages, { colors } = useKjunStyles();
  const geometry = tokens.extensions.calendar;
  const [focus, setFocus] = useState(() => initialFocus(range ? range.start : value, min, max));
  const [mode, setMode] = useState<CalendarMode>("days");
  const shown = parseDate(focus)!, today = todayIso(), days = mode === "days";
  const web = Platform.OS === "web";
  // Web keyboard focus follows the day when the calendar opens, keys move it or the month view closes, as on the web packages.
  const [focusRequest, setFocusRequest] = useState(1);
  const go = (iso: string, moveFocus = false) => { setFocus(clampDate(iso, min, max)); if (moveFocus) setFocusRequest(n => n + 1); };
  const grid = useRef<View>(null);
  useEffect(() => {
    if (!web || mode !== "days") return;
    // The panel takes presses only once it is placed; focus the day then.
    let frames = 0, frame = 0;
    const place = () => {
      const day = (grid.current as unknown as HTMLElement | null)?.querySelector<HTMLElement>(`[data-iso="${focus}"]`);
      if (day && getComputedStyle(day).pointerEvents !== "none") day.focus({ preventScroll: true });
      else if (frames++ < 60) frame = requestAnimationFrame(place);
    };
    place();
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, mode]);
  // Picking a year swaps the year cells for months; focus moves to the shown month instead of falling away.
  const monthCells = useRef<(View | null)[]>([]), [monthFocus, setMonthFocus] = useState(0);
  useEffect(() => {
    const cell = monthFocus && mode === "months" ? monthCells.current[shown.month] : null;
    if (!cell) return;
    if (web) (cell as unknown as HTMLElement).focus({ preventScroll: true });
    else { const tag = findNodeHandle(cell); if (tag) AccessibilityInfo.setAccessibilityFocus(tag); }
  }, [monthFocus]);
  const labels = calendarLabels(shown.year, shown.month, scope), names = monthNames(shown.year, scope);
  const years = yearGrid(shown.year);
  const title = days ? labels.title : mode === "months" ? names.title : `${years[0]} – ${years[11]}`;
  const picking = !!range?.start && !range.end;
  const note = picking && !!(limits?.minDays || limits?.maxDays) ? m.rangeLength(limits!.minDays, limits!.maxDays) : "";
  const announcement = picking ? m.chooseEndDate + (note ? ", " + note : "") : title;
  const footer = calendarFooter({ range: !!range, apply: !!onApply, clearable, todayBlocked: isBlocked(today, min, max) || !!isDateUnavailable?.(today), note: !!note });
  const selectedMonth = parseDate(range ? range.start : value);
  const tone = (weekday: number) => dayTone(weekday, { markSunday, markSaturday, holiday: false });
  // The heading and the range step are announced only as they change: devices speak them directly,
  // the web through an empty live region that fills on change.
  const announced = useRef(announcement), [spoken, setSpoken] = useState("");
  useEffect(() => {
    if (announced.current === announcement) return;
    announced.current = announcement;
    if (Platform.OS === "web") setSpoken(announcement);
    else AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);
  const nav = (delta: -1 | 1) => {
    const disabled = stepDisabled(focus, mode, delta, min, max);
    return <Pressable accessibilityRole="button" accessibilityLabel={days ? (delta < 0 ? m.previousMonth : m.nextMonth) : (delta < 0 ? m.previousYear : m.nextYear)}
      accessibilityState={{ disabled }} disabled={disabled} onPress={() => go(stepTarget(focus, mode, delta))}
      style={({ pressed }) => ({ width: geometry.navSize, height: geometry.navSize, borderRadius: tokens.radius.radius10, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? colors.hover : undefined })}>
      <KjunIcon name={delta < 0 ? "chevron-left" : "chevron-right"} size={geometry.navSize / 2} color={disabled ? colors.textDisabled : colors.text} />
    </Pressable>;
  };
  const cell = (key: string | number, label: string, { selected, disabled, current, onPress, month }: { selected: boolean; disabled: boolean; current: boolean; onPress: () => void; month?: number }) =>
    <Pressable key={key} ref={month == null || disabled ? undefined : (node: View | null) => { monthCells.current[month] = node; }} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ flexBasis: "30%", flexGrow: 1, height: geometry.monthHeight, borderRadius: geometry.monthRadius, alignItems: "center", justifyContent: "center",
        // This month and this year are filled, never outlined; the fill is always there so only its colour changes.
        backgroundColor: selected ? colors.brand : pressed && !disabled ? colors.hover : current ? colors.brandSubtleBg : "transparent" })}
      {...(Platform.OS === "web" ? { dataSet: { current: current || undefined, selected: selected || undefined } } : {})}>
      <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: selected ? colors.onBrand : disabled ? colors.textDisabled : colors.text,
        fontWeight: selected ? typeStyle("control").fontWeight : typeStyle("label").fontWeight }}>{label}</KText>
    </Pressable>;
  // Range presets: text only, and the chosen one takes the secondary fill so it never competes with the range ends.
  const preset = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress}
      style={({ pressed }) => ({ paddingHorizontal: tokens.dimension.value12, height: geometry.yearHeight, borderRadius: tokens.radius.radius9999, alignItems: "center", justifyContent: "center",
        backgroundColor: selected ? colors.secondary : pressed ? colors.hover : "transparent" })}>
      <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: selected ? colors.text : colors.textSecondary,
        fontWeight: selected ? typeStyle("control").fontWeight : typeStyle("label").fontWeight }}>{label}</KText>
    </Pressable>
  );
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: geometry.titleGap, minHeight: geometry.headerHeight }}>
        {/* The heading opens the month view, then the year view; it reads larger than the days so the month leads. */}
        <Pressable accessibilityRole="button" accessibilityLabel={days ? m.chooseMonth : m.chooseYear} accessibilityHint={title} accessibilityState={{ expanded: !days }}
          onPress={() => setMode(days ? "months" : mode === "months" ? "years" : "months")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: geometry.titleGap, marginRight: "auto", height: geometry.navSize, paddingHorizontal: tokens.dimension.value8, borderRadius: tokens.radius.radius10, backgroundColor: pressed ? colors.hover : undefined })}>
          <KText aria-hidden={true} style={{ ...typeStyle("cardTitle") }}>{title}</KText>
          <View style={{ transform: [{ rotate: days ? "0deg" : "180deg" }] }}><KjunIcon name="chevron-down" size={tokens.input.md.iconSize} color={colors.textTertiary} /></View>
        </Pressable>
        {nav(-1)}{nav(1)}
      </View>
      {Platform.OS === "web" ? <View aria-live="polite" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}><KText>{spoken}</KText></View> : null}
      {days && !!presets?.length && (
        <View {...(web ? { role: "group", "aria-label": m.rangePresets } : {})} style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.yearGap, marginBottom: geometry.footerGap }}>
          {presets.map(item => preset(item.label, item.label, range?.start === item.value.start && range?.end === item.value.end, () => onPreset?.(item.value)))}
        </View>
      )}
      {days ? (
        <View ref={grid} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: geometry.rowGap }}
          {...(web ? { onKeyDown: (event: KeyboardEvent) => {
            const next = moveDate(focus, event.key, event.shiftKey, weekStart);
            if (!next) return;
            event.preventDefault();
            go(next, true);
          } } : {})}>
          {orderWeekdays(labels.weekdays, weekStart).map((day, index) => {
            const t = tone((index + weekStart) % 7);
            return <View key={day} aria-hidden={true} style={{ width: geometry.daySize, height: geometry.weekdayHeight, alignItems: "center", justifyContent: "center" }}>
              <KText {...(Platform.OS === "web" ? { dataSet: { kjunPart: "weekday", tone: t === "text" ? undefined : t } } : {})}
                style={{ ...typeStyle("meta"), color: t === "danger" ? colors.danger : t === "info" ? colors.info : colors.textTertiary }}>{day}</KText>
            </View>;
          })}
          {calendarDays(shown.year, shown.month, { value, range, min, max, today, weekStart, unavailable: isDateUnavailable, limits }).map(day => {
            const role = range ? rangeRole(day) : null;
            return <CalendarDayCell key={day.iso} day={day} density="compact" emphasis="picker" tone={tone(day.weekday)} column={(day.weekday - weekStart + 7) % 7}
              // Devices have no "current date" state, so today joins the name.
              label={dateLabel(day.iso, scope) + (day.today && Platform.OS !== "web" ? ", " + m.today : "")}
              hint={role === "start" ? m.rangeStartDay : role === "end" ? m.rangeEndDay : role === "between" ? m.inRangeDay : undefined}
              dim={day.outside ? geometry.outsideOpacity : day.limited ? geometry.limitOpacity : undefined} tabIndex={day.iso === focus ? 0 : -1} inRangeToday={day.today && (day.inRange || day.rangeStart || day.rangeEnd)}
              onPress={() => { setFocus(day.iso); onSelect(day.iso); }} />;
          })}
        </View>
      ) : mode === "months" ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.monthGap, marginTop: geometry.monthGap }}>
            {names.months.map((name, month) => cell(name, name, {
              selected: selectedMonth?.year === shown.year && selectedMonth.month === month, disabled: monthOutside(shown.year, month, min, max),
              current: today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7)), month, onPress: () => { go(pickMonth(focus, month), true); setMode("days"); },
            }))}
          </View>
        </>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.monthGap, marginTop: geometry.monthGap }}>
          {years.map(year => cell(year, String(year), {
            selected: year === shown.year, disabled: yearOutside(year, min, max), current: today.startsWith(String(year).padStart(4, "0")),
            onPress: () => { go(pickYear(focus, year)); setMode("months"); setMonthFocus(n => n + 1); },
          }))}
        </View>
      )}
      {days && footer.shown && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: geometry.footerGap, marginTop: geometry.footerSpace }}>
          {footer.note ? <KText style={{ ...typeStyle("caption"), color: colors.textSecondary, flexShrink: 1 }}>{note}</KText>
            : footer.clear ? <KjunButton size="sm" variant="ghost" onPress={onClear}>{range ? m.clearDates : m.clearDate}</KjunButton> : <View />}
          {footer.action === "apply"
            ? <KjunButton size="sm" variant="secondary" disabled={!range || !canApplyRange(range)} onPress={onApply}>{m.apply}</KjunButton>
            : footer.action === "today" ? <KjunButton size="sm" variant="secondary" onPress={() => { go(today, true); onSelect(today); }}>{m.today}</KjunButton> : null}
        </View>
      )}
    </View>
  );
}
