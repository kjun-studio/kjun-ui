import {
  splitClamp, splitCollapseAt, splitDoublePress, splitFoldedPx, splitKeyAction, splitKeyCollapse, splitKeyHeld, splitKeyTarget, splitLimits,
  splitPercent, splitReport, splitWanted, splitWantedPx, SPLIT_PRESS_SLOP,
  type SplitDirection, type SplitKeyAction, type SplitMax, type SplitMin, type SplitUnit,
} from "../../../shared/package-runtime/split-pane";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { I18nManager, PanResponder, Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { focusVisible } from "./a11y";
import { useKjunStyles } from "./provider";

export interface KjunSplitPaneProps {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction?: SplitDirection;
  /**
   * "ratio": sizes are the first pane's share (0–1) of the room beside the handle, so the split keeps its proportion as
   * the container resizes. "px": sizes are the first pane's points, so a side list keeps its width.
   */
  sizeUnit?: SplitUnit;
  /** Controlled size of the first pane in sizeUnit; pair with onSizeChange. */
  size?: number;
  /** The starting size without size, and the size a double tap (or Enter on Native Web, when the pane does not collapse) restores. Half the room without it. */
  defaultSize?: number;
  /** Smallest points of the first and second pane. A minimum beats the size and the maximums. */
  minSize?: SplitMin;
  /** Largest points of the first and second pane; null leaves a pane unlimited. */
  maxSize?: SplitMax;
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: string;
  /** Keeps the split where it is: the handle takes no touch, key or focus. */
  disabled?: boolean;
  /** The first pane collapses to collapsedSize when dragged past half its minimum, with Enter or Home on Native Web, or a screen reader action. */
  collapsible?: boolean;
  /** Points a collapsed first pane keeps, e.g. 48 for an icon rail the app draws in first. 0 hides the pane. */
  collapsedSize?: number;
  /** Controlled collapsed state; pair with onCollapsedChange. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Hides the second pane and the handle; the first pane takes the whole room and stays mounted, keeping its scroll, selection and focus (a list that opens its detail beside it). second stays mounted too. */
  secondHidden?: boolean;
  /** Every step of a drag, key press or screen reader adjustment. */
  onSizeChange?: (size: number) => void;
  /** Once when a drag ends or a key or screen reader action moves the handle; the place to save the size. */
  onChangeCommit?: (size: number) => void;
  first: ReactNode;
  second: ReactNode;
  style?: StyleProp<ViewStyle>;
}

const geometry = tokens.extensions.splitPane;
// A mouse on Native Web gets the narrow handle; touch runtimes get the full target.
const hit = Platform.OS === "web" ? geometry.handleHit : geometry.touchHandleHit;

/** Two panes with a handle between them; dragging it resizes the first pane, and screen readers adjust it in steps. */
export function KjunSplitPane({ direction = "horizontal", sizeUnit = "ratio", size, defaultSize, minSize, maxSize, ariaLabel, disabled = false,
  collapsible = false, collapsedSize, collapsed, defaultCollapsed = false, onCollapsedChange, secondHidden = false,
  onSizeChange, onChangeCommit, first, second, style }: KjunSplitPaneProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const firstId = "kjun-split-pane-" + useId().replace(/:/g, "");
  const vertical = direction === "vertical", rtl = !!I18nManager.isRTL && !vertical;
  const [own, setOwn] = useState(defaultSize);
  const [ownCollapsed, setOwnCollapsed] = useState(defaultCollapsed);
  // The measured main-axis length; 0 until the first layout.
  const [total, setTotal] = useState(0);
  const [dragging, setDragging] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const wanted = splitWanted(size ?? own, defaultSize, sizeUnit);
  const folded = collapsible && (collapsed ?? ownCollapsed);
  const limits = splitLimits(total, hit, minSize, maxSize);
  const foldPx = splitFoldedPx(collapsedSize, total, hit);
  const px = total > 0 ? (folded ? foldPx : splitClamp(splitWantedPx(wanted, sizeUnit, total, hit), limits)) : null;
  const current = useRef({ wanted, folded, total, limits, disabled, rtl, vertical, size, defaultSize, sizeUnit, collapsible, collapsed, collapsedSize,
    onSizeChange, onChangeCommit, onCollapsedChange });
  current.current = { wanted, folded, total, limits, disabled, rtl, vertical, size, defaultSize, sizeUnit, collapsible, collapsed, collapsedSize,
    onSizeChange, onChangeCommit, onCollapsedChange };
  const changed = useRef(false), start = useRef(0), lastPress = useRef<{ at: number; x: number; y: number } | null>(null);
  const pxNow = () => {
    const now = current.current;
    return now.folded ? splitFoldedPx(now.collapsedSize, now.total, hit) : splitClamp(splitWantedPx(now.wanted, now.sizeUnit, now.total, hit), now.limits);
  };
  const moveTo = (nextPx: number) => {
    const now = current.current;
    // A container with no room has no size to report; the asked size is kept for when it has room again.
    if (now.total <= hit) return;
    const next = splitReport(splitClamp(nextPx, now.limits), now.sizeUnit, now.total, hit);
    if (next === now.wanted) return;
    now.wanted = next;
    changed.current = true;
    if (now.size === undefined) setOwn(next);
    now.onSizeChange?.(next);
  };
  const fold = (next: boolean) => {
    const now = current.current;
    if (!now.collapsible || next === now.folded) return;
    now.folded = next;
    if (now.collapsed === undefined) setOwnCollapsed(next);
    now.onCollapsedChange?.(next);
  };
  const commit = () => {
    if (!changed.current) return;
    changed.current = false;
    current.current.onChangeCommit?.(current.current.wanted as number);
  };
  const resetPx = () => {
    const now = current.current;
    return splitWantedPx(splitWanted(now.defaultSize, undefined, now.sizeUnit), now.sizeUnit, now.total, hit);
  };
  // A pane removed in the middle of a drag still reports the size it reached.
  const leave = useRef(commit);
  leave.current = commit;
  useEffect(() => () => leave.current(), []);
  const act = (action: SplitKeyAction) => {
    const now = current.current;
    if (now.disabled || now.total <= hit) return;
    const plan = splitKeyCollapse(action, now.collapsible, now.folded);
    if (plan.collapse !== null) fold(plan.collapse);
    if (plan.move) moveTo(splitKeyTarget(action, pxNow(), now.limits, resetPx()));
    commit();
  };
  const reset = () => {
    if (current.current.disabled || current.current.total <= hit) return;
    fold(false);
    moveTo(resetPx());
    commit();
  };
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponderCapture: () => !current.current.disabled,
    onMoveShouldSetPanResponderCapture: () => !current.current.disabled,
    // A scroll view or a system gesture that takes the touch ends the drag where it is.
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { start.current = pxNow(); setDragging(true); },
    onPanResponderMove: (_event, gesture) => {
      const now = current.current;
      // Disabled in the middle of a drag: the pane stays where it is until the touch lifts.
      if (now.disabled) return;
      const next = start.current + (now.vertical ? gesture.dy : now.rtl ? -gesture.dx : gesture.dx);
      if (now.collapsible) {
        const shut = splitCollapseAt(next, now.limits.low, splitFoldedPx(now.collapsedSize, now.total, hit));
        fold(shut);
        if (shut) return;
      }
      moveTo(next);
    },
    onPanResponderRelease: (event, gesture) => {
      setDragging(false);
      commit();
      // Two taps in place restore the default size: the responder owns the touch, so it counts the taps itself.
      if (Math.abs(gesture.dx) > SPLIT_PRESS_SLOP || Math.abs(gesture.dy) > SPLIT_PRESS_SLOP) { lastPress.current = null; return; }
      const press = { at: Date.now(), x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
      if (splitDoublePress(lastPress.current, press)) { lastPress.current = null; reset(); }
      else lastPress.current = press;
    },
    onPanResponderTerminate: () => { setDragging(false); commit(); lastPress.current = null; },
  }), []);
  const percent = (value: number) => splitPercent(value, total, hit);
  const now = px === null ? Math.round((sizeUnit === "ratio" && wanted !== null ? wanted : 0.5) * 100) : percent(px);
  const low = px === null ? 0 : percent(collapsible ? Math.min(limits.low, foldPx) : limits.low), high = px === null ? 100 : percent(limits.high);
  const along = vertical ? "height" : "width", across = vertical ? "width" : "height";
  const barLength = dragging ? geometry.activeBarLength : geometry.barLength;
  const pane: ViewStyle = { minWidth: 0, minHeight: 0, overflow: "hidden" };
  // A pane collapsed to nothing leaves the reading order with its width.
  const restFold = splitFoldedPx(collapsedSize, Infinity, 0);
  const hidden = !secondHidden && folded && (px === null ? restFold === 0 : px === 0);
  // Before the first layout a ratio shares the room by flex; pixels and a collapsed pane take their points at once.
  const firstSize: ViewStyle = px !== null ? { [along]: px } : folded ? { [along]: restFold }
    : sizeUnit === "px" && wanted !== null ? { [along]: wanted } : { flexGrow: Math.max(0, sizeUnit === "ratio" && wanted !== null ? wanted : 0.5), flexBasis: 0 };
  const growsBefore = px === null && !folded && !(sizeUnit === "px" && wanted !== null);
  const actions = [{ name: "increment", label: m.increase }, { name: "decrement", label: m.decrease },
    ...(collapsible ? [{ name: "activate", label: folded ? m.expand : m.collapse }] : [])];
  return (
    <View onLayout={event => {
      const next = event.nativeEvent.layout[along];
      if (Math.abs(next - total) > 0.5) setTotal(next);
    }} style={[{ flexDirection: vertical ? "column" : "row", width: "100%", height: "100%", minWidth: 0, minHeight: 0 }, style]}>
      <View style={[pane, secondHidden ? { flex: 1 } : firstSize]} accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? "no-hide-descendants" : "auto"}
        {...(Platform.OS === "web" ? { nativeID: firstId } : {})}>{first}</View>
      <View {...responder.panHandlers} style={{ [along]: hit, alignSelf: "stretch", borderRadius: tokens.radius.radius8, ...(secondHidden ? { display: "none" as const } : {}),
        backgroundColor: dragging ? colors.hover : undefined,
        ...(Platform.OS === "web" ? ({ cursor: disabled ? "default" : vertical ? "row-resize" : "col-resize", touchAction: "none", userSelect: "none" } as unknown as ViewStyle) : {}) }}>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel={ariaLabel}
          accessibilityState={{ disabled, ...(collapsible ? { expanded: !folded } : {}) }}
          accessibilityValue={{ min: low, max: high, now }}
          accessibilityActions={actions}
          onAccessibilityAction={event => {
            const name = event.nativeEvent.actionName;
            act(name === "activate" ? "reset" : name === "increment" ? "increase" : "decrease");
          }}
          disabled={disabled}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onFocus={event => { if (focusVisible(event.currentTarget)) setFocused(true); }}
          onBlur={() => setFocused(false)}
          {...(Platform.OS === "web" ? {
            // The handle points at the pane it resizes, as on Web.
            "aria-controls": firstId,
            "aria-valuenow": now, "aria-valuemin": low, "aria-valuemax": high, "aria-orientation": vertical ? "horizontal" : "vertical", "aria-disabled": disabled,
            onKeyDown: (event: any) => {
              const action = splitKeyAction(event.key, direction, rtl);
              if (!action || disabled || splitKeyHeld(event)) return;
              event.preventDefault();
              act(action);
            },
          } : {})}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.radius8,
            // The browser's own focus outline (style auto) would ring the whole handle; the ring goes round the bar below.
            ...(Platform.OS === "web" ? ({ outlineStyle: "none", outlineWidth: 0, cursor: "inherit" } as unknown as ViewStyle) : {}) }}>
          {/* Like Web: the keyboard ring goes round the bar, not the whole handle. */}
          <View pointerEvents="none" style={{ [across]: barLength, [along]: geometry.barWidth, borderRadius: tokens.radius.radius9999,
            ...(Platform.OS === "web" ? ({ outlineStyle: "solid", outlineWidth: focused ? tokens.states.focus.width : 0,
              outlineOffset: tokens.states.focus.offset, outlineColor: colors.focusRing } as unknown as ViewStyle) : {}),
            backgroundColor: disabled ? colors.border : dragging || focused ? colors.text : hovered ? colors.textTertiary : colors.borderStrong ?? colors.border }} />
        </Pressable>
      </View>
      <View style={[pane, growsBefore ? { flexGrow: Math.max(0, 1 - (sizeUnit === "ratio" && wanted !== null ? wanted : 0.5)), flexBasis: 0 } : { flex: 1 }, secondHidden ? { display: "none" } : null]}
        accessibilityElementsHidden={secondHidden} importantForAccessibility={secondHidden ? "no-hide-descendants" : "auto"}>{second}</View>
    </View>
  );
}
