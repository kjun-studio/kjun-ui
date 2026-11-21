import { wheelCopies, wheelHome, wheelItemAt, wheelKey, wheelRow, wheelSeparated, type WheelColumn, type WheelColumnKey } from "../../../shared/package-runtime/time-wheel";
import { tokens } from "@kjun-ui/tokens";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, Pressable, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from "react-native";
import { KText, useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { focusVisible } from "./a11y";
import { inputTypeStyle, typeStyle } from "./typography";

// The Native form of the web TimeWheel: a snapping ScrollView per column, rows fading with their distance from the band.
const geometry = tokens.extensions.timePicker, rowHeight = geometry.wheelRowHeight, visible = geometry.wheelVisibleRows;
const edge = (visible - 1) / 2;
// The web preview has no momentum events, so a stop is the idle time after the last scroll.
const settleDelay = 120;
// The longest a smooth scroll of the column's own may take before a stop counts again.
const travelLimit = 1000;
// How many frames an opening column keeps taking focus back from the preview's modal.
const focusFrames = 20;
const native = Platform.OS !== "web";

interface ColumnProps {
  column: WheelColumn;
  disabled: boolean;
  readOnly: boolean;
  autoFocus: boolean;
  onPick: (value: number) => void;
  onEnter?: () => void;
  onFocus?: () => void;
  onMove?: (direction: 1 | -1) => void;
  focusRef: (view: View | null) => void;
  /** Set by the first key or press in the wheel. */
  touched: { current: boolean };
}
function WheelColumnView({ column, disabled, readOnly, autoFocus, onPick, onEnter, onFocus, onMove, focusRef, touched }: ColumnProps) {
  const { colors } = useKjunStyles(), reduced = useReducedMotion();
  const scroller = useRef<ScrollView>(null), focusable = useRef<View | null>(null);
  const offset = useRef(0), mounted = useRef(false), momentum = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Where the column itself is scrolling to: its own scroll events are no stop of the user's (cleared by a drag or a mouse wheel).
  const travel = useRef<{ y: number; until: number } | null>(null);
  const go = (y: number, animated: boolean) => {
    travel.current = { y, until: Date.now() + travelLimit };
    scroller.current?.scrollTo({ y, animated });
  };
  const scrollY = useRef(new Animated.Value(0)).current;
  const [focused, setFocused] = useState(false);
  const item = column.items[column.index], locked = disabled || readOnly;
  const latest = useRef({ column, onPick });
  latest.current = { column, onPick };
  const rows = useMemo(() => Array.from({ length: wheelCopies(column) }, (_, copy) => column.items.map((entry, index) => ({ entry, index, row: copy * column.items.length + index }))).flat(),
    [column]);
  const place = (animated: boolean) => {
    const current = mounted.current ? offset.current / rowHeight : null;
    const row = wheelRow(column, column.index, current === null ? null : Math.round(current));
    if (current === null || Math.abs(current - row) > 0.01) go(row * rowHeight, animated);
    if (!animated) { offset.current = row * rowHeight; scrollY.setValue(offset.current); }
    mounted.current = true;
  };
  // Brings the draft's item to the band: at once on the first draw, otherwise the short way round.
  // A new column object with the same item needs no scroll.
  useEffect(() => { if (mounted.current) place(!reduced); }, [column.index, column.items.length, column.loop]);
  // The web preview's panel places itself and its modal takes focus over a few frames, so the column takes it back until they are done.
  useEffect(() => {
    if (!autoFocus || Platform.OS !== "web") return;
    let frame = 0, tries = 0;
    touched.current = false;
    const attempt = () => {
      const node = focusable.current as unknown as HTMLElement | null, active = node?.ownerDocument?.activeElement;
      // A key or press in the wheel is the user's: the guard ends.
      if (touched.current) return;
      if (node && active !== node) node.focus();
      if (tries++ < focusFrames) frame = requestAnimationFrame(attempt);
    };
    attempt();
    return () => cancelAnimationFrame(frame);
  }, [autoFocus]);
  // A mouse wheel on the web preview is the user's scroll, even while the column turns itself.
  useEffect(() => {
    const node = (scroller.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    if (Platform.OS !== "web" || !node?.addEventListener) return;
    const clear = () => { travel.current = null; };
    node.addEventListener("wheel", clear, { passive: true });
    return () => node.removeEventListener("wheel", clear);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const settle = () => {
    const { column, onPick } = latest.current, goal = travel.current;
    if (goal && Math.abs(offset.current - goal.y) > 1 && Date.now() < goal.until) { later(); return; }
    travel.current = null;
    const row = Math.round(offset.current / rowHeight), home = wheelHome(column, row);
    // A looping column comes back to its middle copy unseen, so it never reaches an end.
    if (home !== row) { go(home * rowHeight, false); offset.current = home * rowHeight; }
    if (goal) return;
    const stopped = wheelItemAt(column, row);
    if (stopped.value !== column.items[column.index].value) onPick(stopped.value);
    else if (Math.abs(offset.current - home * rowHeight) > 1) go(home * rowHeight, !reduced);
  };
  const later = () => { clearTimeout(timer.current); timer.current = setTimeout(settle, settleDelay); };
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: native,
    listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.y;
      if (!native) later();
    },
  });
  const step = (key: string) => { if (!locked) { const value = wheelKey(column, key); if (value !== null) onPick(value); } };
  const web = Platform.OS === "web" ? {
    role: "spinbutton", tabIndex: disabled ? -1 : 0, "aria-label": column.label, "aria-valuenow": item.value, "aria-valuetext": item.label,
    "aria-disabled": disabled || undefined, "aria-readonly": readOnly || undefined,
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      touched.current = true;
      if (event.key === "Enter" && onEnter) { event.preventDefault(); onEnter(); return; }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onMove?.(event.key === "ArrowRight" ? 1 : -1); return; }
      if (!["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      step(event.key);
    },
    // The ring marks keyboard focus only, like :focus-visible on the web.
    onFocus: (event: { currentTarget?: unknown; target?: unknown }) => { setFocused(focusVisible(event.currentTarget ?? event.target)); onFocus?.(); }, onBlur: () => setFocused(false),
  } as object : {};
  return (
    <View ref={view => { focusable.current = view; focusRef(view); }} collapsable={false}
      accessible={native} accessibilityRole={native ? "adjustable" : undefined} accessibilityLabel={column.label} accessibilityValue={{ text: item.label }}
      accessibilityState={{ disabled }} accessibilityActions={native && !locked ? [{ name: "increment" }, { name: "decrement" }] : undefined}
      onAccessibilityAction={event => step(event.nativeEvent.actionName === "increment" ? "ArrowUp" : "ArrowDown")}
      {...web}
      style={{ width: geometry.wheelColumnWidth, height: rowHeight * visible, borderRadius: tokens.radius.radius8,
        ...(Platform.OS === "web" ? { outlineStyle: focused ? "solid" : "none", outlineWidth: tokens.states.focus.width, outlineColor: colors.focusRing, outlineOffset: tokens.states.focus.insetOffset } as object : {}) }}>
      <Animated.ScrollView ref={scroller} showsVerticalScrollIndicator={false} scrollEnabled={!locked} nestedScrollEnabled
        snapToInterval={rowHeight} decelerationRate="fast" scrollEventThrottle={16} onScroll={onScroll}
        onContentSizeChange={() => { if (!mounted.current) place(false); }}
        onScrollBeginDrag={() => { travel.current = null; clearTimeout(timer.current); }}
        onScrollEndDrag={() => { if (native) { clearTimeout(timer.current); timer.current = setTimeout(() => { if (!momentum.current) settle(); }, settleDelay); } }}
        onMomentumScrollBegin={() => { momentum.current = true; clearTimeout(timer.current); }}
        onMomentumScrollEnd={() => { momentum.current = false; settle(); }}
        contentContainerStyle={{ paddingVertical: rowHeight * edge }}
        // The web preview snaps with CSS like the web packages.
        style={Platform.OS === "web" ? ({ scrollSnapType: "y mandatory", overscrollBehavior: "contain" } as object) : undefined}
        importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {rows.map(({ entry, index, row }) => {
          const opacity = scrollY.interpolate({ inputRange: [(row - edge - 1) * rowHeight, (row - edge) * rowHeight, row * rowHeight, (row + edge) * rowHeight, (row + edge + 1) * rowHeight],
            outputRange: [0, 0.3, 1, 0.3, 0], extrapolate: "clamp" });
          return <Pressable key={row} disabled={locked} aria-hidden={true} focusable={false} onPress={() => { touched.current = true; if (entry.value !== item.value) onPick(entry.value); }}
            style={{ height: rowHeight, alignItems: "center", justifyContent: "center", ...(Platform.OS === "web" ? { scrollSnapAlign: "center" } as object : {}) }}>
            <Animated.View style={{ opacity }}>
              <KText style={{ ...inputTypeStyle("md"), fontVariant: ["tabular-nums"],
                color: disabled || entry.disabled ? colors.textDisabled : index === column.index ? colors.text : colors.textSecondary,
                ...(index === column.index ? { fontWeight: typeStyle("control").fontWeight } : {}) }}>{entry.label}</KText>
            </Animated.View>
          </Pressable>;
        })}
      </Animated.ScrollView>
    </View>
  );
}

export interface TimeWheelProps {
  columns: WheelColumn[];
  label: string;
  inline?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  focusColumn?: number | null;
  /** The column the person is on: focused (web) or turned. */
  onFocusColumn?: (index: number) => void;
  onPick: (key: WheelColumnKey, value: number) => void;
  onEnter?: () => void;
}
/** The hour, minute (and second, AM/PM) columns over one band that marks the chosen time. */
export function TimeWheel({ columns, label, inline = false, disabled = false, readOnly = false, focusColumn = null, onFocusColumn, onPick, onEnter }: TimeWheelProps) {
  const { colors } = useKjunStyles();
  const views = useRef<(View | null)[]>([]), touched = useRef(false);
  return (
    // A sheet is as wide as the screen; the wheel keeps the web's width, four columns at most, in its middle.
    <View role="group" accessibilityLabel={label} style={{ flexDirection: "row", justifyContent: "center", gap: geometry.wheelColumnGap, height: rowHeight * visible,
      alignSelf: "center", width: "100%", maxWidth: 4 * geometry.wheelColumnWidth + 6 * geometry.wheelColumnGap }}>
      <View aria-hidden={true} style={{ pointerEvents: "none", position: "absolute", left: 0, right: 0, top: rowHeight * edge, height: rowHeight,
        borderRadius: tokens.radius.radius8, backgroundColor: inline ? colors.surface : colors.active }} />
      {columns.map((column, index) => <Fragment key={column.key}>
        {/* A ":" between digit columns sits in the gap on the band, so the band reads "09:30" like the field; it takes no width. */}
        {wheelSeparated(columns, index) && <View aria-hidden={true} style={{ pointerEvents: "none", width: 0, marginHorizontal: -geometry.wheelColumnGap / 2, alignSelf: "center", alignItems: "center" }}>
          <KText style={{ ...inputTypeStyle("md"), fontWeight: typeStyle("control").fontWeight, color: disabled ? colors.textDisabled : colors.text }}>:</KText></View>}
        <WheelColumnView column={column} disabled={disabled} readOnly={readOnly} autoFocus={focusColumn === index} touched={touched}
          focusRef={view => { views.current[index] = view; }} onMove={direction => views.current[index + direction]?.focus?.()} onFocus={() => onFocusColumn?.(index)}
          onPick={value => { onFocusColumn?.(index); onPick(column.key, value); }} onEnter={onEnter} /></Fragment>)}
    </View>
  );
}
