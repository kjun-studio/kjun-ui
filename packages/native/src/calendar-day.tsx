import type { CalendarDay } from "../../../shared/package-runtime/calendar";
import { spanSegment, visibleDots, type DayMarks } from "../../../shared/package-runtime/event-calendar";
import { tokens } from "@kjun-ui/tokens";
import { Platform, View, type AccessibilityActionEvent, type ColorValue } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

// One day of the date picker (compact, 40×40) or of the event calendar (comfortable, full column × 49), drawn as the web's
// .kjun-calendar-day rules in calendar.css and event-calendar.css. Internal: not exported from the package index.
export interface CalendarDayCellProps {
  day: CalendarDay; density: "compact" | "comfortable"; emphasis: "picker" | "event";
  tone: "danger" | "info" | "text"; label: string; hint?: string;
  /** Opacity of the number, dots and icon (never the span bar): outside days, or past days in the event calendar. */
  dim?: number;
  /** The fade is the past one (event calendar): a toned number fades less, as on the web (data-past). */
  past?: boolean;
  /** Event calendar loading: the number fades as a past day's does, except today and outside days (data-loading on the web). */
  loading?: boolean;
  /** Picker: today inside a range band shows a bare brand number instead of the pill. */
  inRangeToday?: boolean;
  marks?: DayMarks<ColorValue>; column?: number;
  /** Web: the roving tab stop, 0 on the focused day. */
  tabIndex?: 0 | -1;
  /** Web: the keyboard long press, e.g. "Shift+Enter". */
  keyShortcuts?: string;
  onPress: () => void; onLongPress?: () => void; longPressLabel?: string;
}

const calendar = tokens.extensions.calendar;
// React Native Web prints dataSet as data-* attributes, so the packed browser contracts read the same states as on the web.
const data = (set: Record<string, string | number | boolean | undefined>) => Platform.OS === "web" ? { dataSet: set } : {};
const longPress = "longpress";

export function CalendarDayCell({ day, density, emphasis, tone, label, hint, dim, past = false, inRangeToday = false, marks, column = 0, loading = false,
  onPress, onLongPress, longPressLabel, tabIndex, keyShortcuts }: CalendarDayCellProps) {
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  const event = emphasis === "event";
  const selected = day.selected;
  const toned = tone === "danger" ? colors.danger : tone === "info" ? colors.info : colors.text;
  // Picker: selected > today in a band > unavailable > tone. Event: today's filled pill > tone.
  const ink = event ? (day.today ? colors.onBrand : toned)
    : selected ? colors.onBrand : day.today && inRangeToday ? colors.brand : day.blocked ? colors.textDisabled : toned;
  const pill = event ? (day.today ? colors.brand : "transparent") : day.today && !selected && !inRangeToday ? colors.brandSubtleBg : "transparent";
  // Outside days win over past; a past danger or info number keeps more of its colour.
  // Loading (event calendar): the days to come fade their number as past days do; today keeps its pill.
  const faded = !day.outside && (past || (loading && !day.today));
  const numberDim = faded && tone !== "text" ? calendar.pastAccentOpacity : faded && !past ? calendar.pastOpacity : dim;
  const dots = visibleDots(marks?.dots), icon = marks?.icon;
  const span = event ? marks?.spans?.[0] : undefined, segment = span ? spanSegment(span, day.iso, column) : null;
  const band = !event && (day.inRange || day.rangeStart || day.rangeEnd) && !(day.rangeStart && day.rangeEnd);
  const actions = onLongPress ? { accessibilityActions: [{ name: longPress, label: longPressLabel }],
    onAccessibilityAction: (action: AccessibilityActionEvent) => { if (action.nativeEvent.actionName === longPress) onLongPress(); } } : {};

  const cell = (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ selected, disabled: day.blocked }}
      // Devices name today in the label; the web marks it as the current date.
      {...(Platform.OS === "web" && day.today ? { "aria-current": "date" } : {})}
      {...data({ iso: day.iso, density, today: day.today || undefined, selected: selected || undefined, outside: day.outside || undefined,
        past: past || undefined, tone: tone === "text" ? undefined : tone, inRange: day.inRange || undefined,
        rangeStart: day.rangeStart || undefined, rangeEnd: day.rangeEnd || undefined, limited: day.limited || undefined })}
      {...(Platform.OS === "web" && tabIndex != null ? { tabIndex } : {})}
      {...(Platform.OS === "web" && keyShortcuts ? { "aria-keyshortcuts": keyShortcuts } : {})}
      {...actions}
      disabled={day.blocked} onPress={onPress} onLongPress={onLongPress} delayLongPress={onLongPress ? calendar.longPressDelay : undefined}
      // Android draws later-added fills with square corners, so every fill below exists from the start and only its colour changes.
      collapsable={false}
      style={({ pressed }) => event
        ? { flex: 1, height: calendar.eventDayHeight, paddingTop: calendar.eventDayPaddingTop, paddingBottom: calendar.eventDayPaddingBottom, alignItems: "center", borderRadius: calendar.dayRadius }
        : { width: calendar.daySize, height: calendar.daySize, borderRadius: calendar.dayRadius, alignItems: "center", justifyContent: "center",
          backgroundColor: selected ? colors.brand : pressed && !day.blocked ? colors.hover : "transparent" }}>
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => <>
        {/* The selected (or pressed) square wraps the number and marks: full cell height, inset at the sides. */}
        {event && <View pointerEvents="none" collapsable={false} {...data({ kjunPart: "square" })}
          style={{ position: "absolute", top: 0, bottom: 0, left: calendar.eventSelectedInset, right: calendar.eventSelectedInset, borderRadius: calendar.dayRadius,
            backgroundColor: selected ? colors.active : pressed || hovered ? colors.hover : "transparent" }} />}
        <View pointerEvents="none" collapsable={false} {...data({ kjunPart: "pill" })}
          style={{ minWidth: calendar.todayPillMinWidth, height: calendar.todayPillHeight, borderRadius: calendar.todayPillCorner,
            // The fade sits on the pill, which owns both the fill and the number, as on the web.
            alignItems: "center", justifyContent: "center", backgroundColor: pill, opacity: numberDim }}>
          <KText {...data({ kjunPart: "number" })} style={{ ...typeStyle("numberMd"), fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"],
            color: ink, fontWeight: selected ? `${calendar.selectedWeight}` as "800" : typeStyle("numberMd").fontWeight,
            textDecorationLine: day.blocked ? "line-through" : "none", textDecorationColor: colors.borderStrong }}>{day.day}</KText>
        </View>
        {event && (icon || dots.length > 0) && (
          <View pointerEvents="none" {...data({ kjunPart: "marks" })} style={{ flexDirection: "row", alignItems: "center", justifyContent: "center",
            gap: calendar.eventDotGap, height: calendar.eventMarkHeight, opacity: dim,
            // Under the bar's lane, at the same height whether or not the day has a bar.
            marginTop: calendar.eventMarkSpace + calendar.eventSpanHeight + calendar.eventMarkSpace }}>
            {icon ? <View {...data({ kjunPart: "icon" })} style={{ width: calendar.eventIconSize, height: calendar.eventIconSize }}>
              <KjunIcon name={icon.name} filled size={calendar.eventIconSize} color={icon.color} />
            </View> : null}
            {dots.map((color, index) => <View key={index} {...data({ kjunPart: "dot" })}
              style={{ width: calendar.eventDotSize, height: calendar.eventDotSize, borderRadius: calendar.eventDotSize / 2, backgroundColor: color }} />)}
          </View>
        )}
        {/* The span bar crosses the whole cell right under the number, above the square; a continuing piece reaches one overlap under the next cell, an end piece stops at its edge.
            It keeps its colour on past days and steps back to the past fade on outside days. */}
        {span && segment ? <View pointerEvents="none" {...data({ kjunPart: "span", start: segment.start || undefined, end: segment.end || undefined })}
          style={{ position: "absolute", left: 0, right: segment.end ? 0 : -calendar.eventSpanOverlap,
            top: calendar.eventDayPaddingTop + calendar.todayPillHeight + calendar.eventMarkSpace, height: calendar.eventSpanHeight, backgroundColor: span.color,
            opacity: day.outside ? calendar.pastOpacity : undefined,
            borderTopLeftRadius: segment.start ? calendar.eventSpanCorner : 0, borderBottomLeftRadius: segment.start ? calendar.eventSpanCorner : 0,
            borderTopRightRadius: segment.end ? calendar.eventSpanCorner : 0, borderBottomRightRadius: segment.end ? calendar.eventSpanCorner : 0 }} /> : null}
      </>}
    </Pressable>
  );
  if (event) return cell;
  return (
    <View style={{ width: calendar.daySize, height: calendar.daySize }}>
      {/* A range joins its ends with a quiet band under the days between them; it ends under the squared ends. */}
      {/* At the week's edges it stops at the cell and closes with the day's corner, so the row reads as finished. */}
      {band && <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, backgroundColor: colors.brandSubtleBg,
        left: day.rangeStart ? calendar.daySize / 2 : column === 0 ? 0 : -calendar.rangeBleed, right: day.rangeEnd ? calendar.daySize / 2 : column === 6 ? 0 : -calendar.rangeBleed,
        ...(column === 0 && !day.rangeStart ? { borderTopLeftRadius: calendar.dayRadius, borderBottomLeftRadius: calendar.dayRadius } : {}),
        ...(column === 6 && !day.rangeEnd ? { borderTopRightRadius: calendar.dayRadius, borderBottomRightRadius: calendar.dayRadius } : {}) }} />}
      {cell}
    </View>
  );
}
