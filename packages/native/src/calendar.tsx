import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { calendarLabels } from "../../../shared/package-runtime/messages";
import {
  addMonths, calendarDays, clampDate, dateLabel, initialFocus, isBlocked, monthNames, monthOutside,
  parseDate, todayIso, toIsoDate, yearChoices, type DateRange,
} from "../../../shared/package-runtime/calendar";
import { tokens } from "@kjun-ui/tokens";
import { useState } from "react";
import { View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton, KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

export interface CalendarViewProps {
  value?: string;
  range?: DateRange;
  min?: string;
  max?: string;
  clearable?: boolean;
  onSelect: (iso: string) => void;
  onClear?: () => void;
  /** Range mode: the footer applies the picked range instead of jumping to today. */
  onApply?: () => void;
}
/** KJUN's calendar, as on Web: a day grid and a month view opened from the heading. */
export function CalendarView({ value, range, min, max, clearable = false, onSelect, onClear, onApply }: CalendarViewProps) {
  const scope = useKjunMessageScope(), m = scope.messages, { colors } = useKjunStyles();
  const geometry = tokens.extensions.calendar;
  const [focus, setFocus] = useState(() => initialFocus(range ? range.start : value, min, max));
  const [view, setView] = useState<"days" | "months">("days");
  const shown = parseDate(focus)!, today = todayIso(), days = view === "days";
  const go = (iso: string) => setFocus(clampDate(iso, min, max));
  const stepDisabled = (delta: number) => days ? monthOutside(shown.year, shown.month + delta, min, max) : monthOutside(shown.year + delta, delta < 0 ? 11 : 0, min, max);
  const step = (delta: number) => go(addMonths(focus, days ? delta : delta * 12));
  const labels = calendarLabels(shown.year, shown.month, scope), names = monthNames(shown.year, scope);
  const selectedMonth = parseDate(range ? range.start : value);
  const complete = !!range?.start && !!range?.end;
  const nav = (delta: number) => {
    const disabled = stepDisabled(delta);
    return <Pressable accessibilityRole="button" accessibilityLabel={days ? (delta < 0 ? m.previousMonth : m.nextMonth) : (delta < 0 ? m.previousYear : m.nextYear)}
      accessibilityState={{ disabled }} disabled={disabled} onPress={() => step(delta)}
      style={({ pressed }) => ({ width: geometry.navSize, height: geometry.navSize, borderRadius: tokens.radius.radius10, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? colors.hover : undefined })}>
      <KjunIcon name={delta < 0 ? "chevron-left" : "chevron-right"} size={geometry.navSize / 2} color={disabled ? colors.textDisabled : colors.text} />
    </Pressable>;
  };
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: geometry.titleGap, minHeight: geometry.headerHeight }}>
        {/* The heading opens the month view; it reads larger than the days so the month leads. */}
        <Pressable accessibilityRole="button" accessibilityLabel={m.chooseMonth} accessibilityState={{ expanded: !days }} onPress={() => setView(days ? "months" : "days")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: geometry.titleGap, marginRight: "auto", height: geometry.navSize, paddingHorizontal: tokens.dimension.value8, borderRadius: tokens.radius.radius10, backgroundColor: pressed ? colors.hover : undefined })}>
          <KText aria-hidden={true} style={{ ...typeStyle("cardTitle") }}>{days ? labels.title : names.title}</KText>
          <View style={{ transform: [{ rotate: days ? "0deg" : "180deg" }] }}><KjunIcon name="chevron-down" size={tokens.input.md.iconSize} color={colors.textTertiary} /></View>
        </Pressable>
        {nav(-1)}{nav(1)}
      </View>
      {days ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: geometry.rowGap }}>
          {labels.weekdays.map((day, index) => (
            <View key={day} aria-hidden={true} style={{ width: geometry.daySize, height: geometry.weekdayHeight, alignItems: "center", justifyContent: "center" }}>
              <KText style={{ ...typeStyle("meta"), color: index === 0 ? colors.danger : colors.textTertiary }}>{day}</KText>
            </View>
          ))}
          {calendarDays(shown.year, shown.month, { value, range, min, max, today }).map(day => {
            const ink = day.selected ? colors.onBrand : day.blocked || day.outside ? colors.textDisabled : day.weekday === 0 ? colors.danger : colors.text;
            const band = complete && (day.inRange || day.rangeStart || day.rangeEnd) && !(day.rangeStart && day.rangeEnd);
            return (
              <View key={day.iso} style={{ width: geometry.daySize, height: geometry.daySize }}>
                {/* A range joins its ends with a quiet band that runs under the days between them. */}
                {band && <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, backgroundColor: colors.brandSubtleBg,
                  left: day.rangeStart ? geometry.daySize / 2 : -geometry.rangeBleed, right: day.rangeEnd ? geometry.daySize / 2 : -geometry.rangeBleed }} />}
                <Pressable accessibilityRole="button" accessibilityLabel={dateLabel(day.iso, scope)} accessibilityState={{ selected: day.selected, disabled: day.blocked }}
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
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: geometry.monthGap, marginTop: geometry.monthGap }}>
            {names.months.map((name, month) => {
              const disabled = monthOutside(shown.year, month, min, max), selected = selectedMonth?.year === shown.year && selectedMonth.month === month;
              const current = today.startsWith(toIsoDate(shown.year, month, 1).slice(0, 7));
              return <Pressable key={name} accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected, disabled }} disabled={disabled}
                onPress={() => { go(toIsoDate(shown.year, month, Math.min(shown.day, new Date(shown.year, month + 1, 0).getDate()))); setView("days"); }}
                style={({ pressed }) => ({ flexBasis: "30%", flexGrow: 1, height: geometry.monthHeight, borderRadius: geometry.monthRadius, alignItems: "center", justifyContent: "center",
                  backgroundColor: selected ? colors.brand : pressed ? colors.hover : undefined, ...(current && !selected ? { borderWidth: geometry.todayRing, borderColor: colors.borderStrong } : {}) })}>
                <KText style={{ ...typeStyle("label"), color: selected ? colors.onBrand : disabled ? colors.textDisabled : colors.text }}>{name}</KText>
              </Pressable>;
            })}
          </View>
          {/* Year chips only when the bounds leave more than one year to choose. */}
          {yearChoices(shown.year, min, max).length > 1 && <View style={{ flexDirection: "row", gap: geometry.yearGap, marginTop: geometry.footerGap }}>
            {yearChoices(shown.year, min, max).map(year => (
              <Pressable key={year} accessibilityRole="button" accessibilityLabel={String(year)} accessibilityState={{ selected: year === shown.year }} onPress={() => go(addMonths(focus, (year - shown.year) * 12))}
                style={{ flex: 1, height: geometry.yearHeight, borderRadius: tokens.radius.radius9999, alignItems: "center", justifyContent: "center", backgroundColor: year === shown.year ? colors.text : colors.secondary }}>
                <KText style={{ ...typeStyle("label"), fontVariant: ["tabular-nums"], color: year === shown.year ? colors.surface : colors.textSecondary }}>{year}</KText>
              </Pressable>
            ))}
          </View>}
        </>
      )}
      {days && (onApply || clearable || !isBlocked(today, min, max)) && (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: geometry.footerGap, marginTop: geometry.footerGap, paddingTop: geometry.footerGap, borderTopWidth: tokens.border.defaultWidth, borderTopColor: colors.divider }}>
          {onApply || clearable ? <KjunButton size="sm" variant="ghost" onPress={onClear}>{m.clearDate}</KjunButton> : <View />}
          {onApply
            ? <KjunButton size="sm" variant="secondary" disabled={!range?.start || !range?.end} onPress={onApply}>{m.apply}</KjunButton>
            : <KjunButton size="sm" variant="secondary" disabled={isBlocked(today, min, max)} onPress={() => { setFocus(today); onSelect(today); }}>{m.today}</KjunButton>}
        </View>
      )}
    </View>
  );
}
