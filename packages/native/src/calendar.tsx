import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  calendarDays, calendarFooter, canApplyRange, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside, orderWeekdays,
  parseDate, pickMonth, pickYear, rangeRole, stepDisabled, stepTarget, todayIso, toIsoDate, yearChoices, yearGrid, yearOutside,
  type CalendarMode, type DateRange, type DateUnavailable, type WeekStart,
} from "../../../shared/package-runtime/calendar";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton, KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export interface CalendarOptions {
  /** The first column of the week: 0 Sunday (default), 1 Monday. */
  weekStart?: WeekStart;
  /** Paints Sundays with the danger role, as Korean calendars do (default true). */
  markSunday?: boolean;
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
}
/** KJUN's calendar, as on Web: a day grid, and month and year views opened from the heading. */
export function CalendarView({ value, range, min, max, clearable = false, weekStart = 0, markSunday = true, isDateUnavailable,
  onSelect, onClear, onApply, presets, onPreset }: CalendarViewProps) {
  const scope = useKjunMessageScope(), m = scope.messages, { colors } = useKjunStyles();
  const geometry = tokens.extensions.calendar;
  const [focus, setFocus] = useState(() => initialFocus(range ? range.start : value, min, max));
  const [mode, setMode] = useState<CalendarMode>("days");
  const shown = parseDate(focus)!, today = todayIso(), days = mode === "days";
  const go = (iso: string) => setFocus(clampDate(iso, min, max));
  const labels = calendarLabels(shown.year, shown.month, scope), names = monthNames(shown.year, scope);
  const years = yearGrid(shown.year);
  const title = days ? labels.title : mode === "months" ? names.title : `${years[0]} – ${years[11]}`;
  const picking = !!range?.start && !range.end;
  const announcement = picking ? m.chooseEndDate : title;
  const footer = calendarFooter({ range: !!range, apply: !!onApply, clearable, todayBlocked: isBlocked(today, min, max) || !!isDateUnavailable?.(today) });
  const selectedMonth = parseDate(range ? range.start : value);
  const sunday = (weekday: number) => markSunday && weekday === 0;
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
  const cell = (key: string | number, label: string, { selected, disabled, current, onPress }: { selected: boolean; disabled: boolean; current: boolean; onPress: () => void }) =>
    <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ flexBasis: "30%", flexGrow: 1, height: geometry.monthHeight, borderRadius: geometry.monthRadius, alignItems: "center", justifyContent: "center",
        backgroundColor: selected ? colors.brand : pressed ? colors.hover : undefined, ...(current && !selected ? { borderWidth: geometry.todayRing, borderColor: colors.borderStrong } : {}) })}>
      <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: selected ? colors.onBrand : disabled ? colors.textDisabled : colors.text }}>{label}</KText>
    </Pressable>;
  const chip = (key: string | number, label: string, selected: boolean, onPress: () => void, grow = true) => (
    <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress}
      style={{ ...(grow ? { flex: 1 } : { paddingHorizontal: tokens.dimension.value12 }), height: geometry.yearHeight, borderRadius: tokens.radius.radius9999, alignItems: "center", justifyContent: "center",
        backgroundColor: selected ? colors.text : colors.secondary }}>
      <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: selected ? colors.surface : colors.textSecondary }}>{label}</KText>
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.yearGap, marginBottom: geometry.footerGap }}>
          {presets.map(preset => chip(preset.label, preset.label, range?.start === preset.value.start && range?.end === preset.value.end, () => onPreset?.(preset.value), false))}
        </View>
      )}
      {days ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: geometry.rowGap }}>
          {orderWeekdays(labels.weekdays, weekStart).map((day, index) => (
            <View key={day} aria-hidden={true} style={{ width: geometry.daySize, height: geometry.weekdayHeight, alignItems: "center", justifyContent: "center" }}>
              <KText style={{ ...typeStyle("meta"), color: sunday((index + weekStart) % 7) ? colors.danger : colors.textTertiary }}>{day}</KText>
            </View>
          ))}
          {calendarDays(shown.year, shown.month, { value, range, min, max, today, weekStart, unavailable: isDateUnavailable }).map(day => {
            const ink = day.selected ? colors.onBrand : day.blocked || day.outside ? colors.textDisabled : sunday(day.weekday) ? colors.danger : colors.text;
            const band = (day.inRange || day.rangeStart || day.rangeEnd) && !(day.rangeStart && day.rangeEnd);
            const role = range ? rangeRole(day) : null;
            // Devices have no "current date" state, so today joins the name.
            const label = dateLabel(day.iso, scope) + (day.today && Platform.OS !== "web" ? ", " + m.today : "");
            return (
              <View key={day.iso} style={{ width: geometry.daySize, height: geometry.daySize }}>
                {/* A range joins its ends with a quiet band that runs under the days between them. */}
                {band && <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, backgroundColor: colors.brandSubtleBg,
                  left: day.rangeStart ? geometry.daySize / 2 : -geometry.rangeBleed, right: day.rangeEnd ? geometry.daySize / 2 : -geometry.rangeBleed }} />}
                <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: day.selected, disabled: day.blocked }}
                  accessibilityHint={role === "start" ? m.rangeStartDay : role === "end" ? m.rangeEndDay : role === "between" ? m.inRangeDay : undefined}
                  {...(Platform.OS === "web" && day.today ? { "aria-current": "date" } : {})}
                  disabled={day.blocked} onPress={() => { setFocus(day.iso); onSelect(day.iso); }}
                  style={({ pressed }) => ({ width: geometry.daySize, height: geometry.daySize, borderRadius: geometry.daySize / 2, alignItems: "center", justifyContent: "center",
                    backgroundColor: day.selected ? colors.brand : pressed ? colors.hover : undefined,
                    ...(day.today && !day.selected ? { borderWidth: geometry.todayRing, borderColor: colors.borderStrong } : {}) })}>
                  <KText style={{ ...typeStyle("body"), fontVariant: ["tabular-nums"], color: ink, textDecorationLine: day.blocked ? "line-through" : "none",
                    fontWeight: day.selected || day.today ? typeStyle("control").fontWeight : typeStyle("body").fontWeight }}>{day.day}</KText>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : mode === "months" ? (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.monthGap, marginTop: geometry.monthGap }}>
            {names.months.map((name, month) => cell(name, name, {
              selected: selectedMonth?.year === shown.year && selectedMonth.month === month, disabled: monthOutside(shown.year, month, min, max),
              current: today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7)), onPress: () => { go(pickMonth(focus, month)); setMode("days"); },
            }))}
          </View>
          {/* Year chips only when the bounds leave more than one year to choose. */}
          {yearChoices(shown.year, min, max).length > 1 && <View style={{ flexDirection: "row", gap: geometry.yearGap, marginTop: geometry.footerGap }}>
            {yearChoices(shown.year, min, max).map(year => chip(year, String(year), year === shown.year, () => go(pickYear(focus, year))))}
          </View>}
        </>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.monthGap, marginTop: geometry.monthGap }}>
          {years.map(year => cell(year, String(year), {
            selected: year === shown.year, disabled: yearOutside(year, min, max), current: today.startsWith(String(year).padStart(4, "0")),
            onPress: () => { go(pickYear(focus, year)); setMode("months"); },
          }))}
        </View>
      )}
      {days && footer.shown && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: geometry.footerGap, marginTop: geometry.footerGap, paddingTop: geometry.footerGap, borderTopWidth: tokens.border.defaultWidth, borderTopColor: colors.divider }}>
          {footer.clear ? <KjunButton size="sm" variant="ghost" onPress={onClear}>{range ? m.clearDates : m.clearDate}</KjunButton> : <View />}
          {footer.action === "apply"
            ? <KjunButton size="sm" variant="secondary" disabled={!range || !canApplyRange(range)} onPress={onApply}>{m.apply}</KjunButton>
            : footer.action === "today" ? <KjunButton size="sm" variant="secondary" onPress={() => { setFocus(today); onSelect(today); }}>{m.today}</KjunButton> : null}
        </View>
      )}
    </View>
  );
}
