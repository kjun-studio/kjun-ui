import {
  splitClamp, splitFromRatio, splitKeyAction, splitKeyHeld, splitKeyTarget, splitLimits, splitPercent, splitShare, splitToRatio,
  type SplitDirection, type SplitKeyAction, type SplitMax, type SplitMin,
} from "../../../shared/package-runtime/split-pane";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { I18nManager, PanResponder, Platform, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { focusVisible } from "./a11y";
import { useKjunStyles } from "./provider";

export interface KjunSplitPaneProps {
  /** horizontal puts the panes side by side; vertical stacks them and needs a height from its parent. */
  direction?: SplitDirection;
  /** Controlled share (0–1) of the room beside the handle that the first pane takes; pair with onSizeChange. */
  size?: number;
  /** The starting share without size, and the share Enter restores on Native Web. */
  defaultSize?: number;
  /** Smallest points of the first and second pane. A minimum beats the share and the maximums. */
  minSize?: SplitMin;
  /** Largest points of the first and second pane; null leaves a pane unlimited. */
  maxSize?: SplitMax;
  /** Names the handle, e.g. "메시지 목록 크기". */
  ariaLabel: string;
  /** Keeps the split where it is: the handle takes no touch, key or focus. */
  disabled?: boolean;
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
export function KjunSplitPane({ direction = "horizontal", size, defaultSize = 0.5, minSize, maxSize, ariaLabel, disabled = false,
  onSizeChange, onChangeCommit, first, second, style }: KjunSplitPaneProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const vertical = direction === "vertical", rtl = !!I18nManager.isRTL && !vertical;
  const [own, setOwn] = useState(defaultSize);
  // The measured main-axis length; 0 until the first layout.
  const [total, setTotal] = useState(0);
  const [dragging, setDragging] = useState(false), [hovered, setHovered] = useState(false), [focused, setFocused] = useState(false);
  const wanted = splitShare(size ?? own, defaultSize);
  const limits = splitLimits(total, hit, minSize, maxSize);
  const px = total > 0 ? splitClamp(splitFromRatio(wanted, total, hit), limits) : null;
  const current = useRef({ wanted, total, limits, disabled, rtl, vertical, size, defaultSize, onSizeChange, onChangeCommit });
  current.current = { wanted, total, limits, disabled, rtl, vertical, size, defaultSize, onSizeChange, onChangeCommit };
  const changed = useRef(false), start = useRef(0);
  const pxNow = () => splitClamp(splitFromRatio(current.current.wanted, current.current.total, hit), current.current.limits);
  const moveTo = (nextPx: number) => {
    const now = current.current;
    // A container with no room has no size to report; the asked share is kept for when it has room again.
    if (now.total <= hit) return;
    const next = splitToRatio(splitClamp(nextPx, now.limits), now.total, hit);
    if (next === now.wanted) return;
    now.wanted = next;
    changed.current = true;
    if (now.size === undefined) setOwn(next);
    now.onSizeChange?.(next);
  };
  const commit = () => {
    if (!changed.current) return;
    changed.current = false;
    current.current.onChangeCommit?.(current.current.wanted);
  };
  // A pane removed in the middle of a drag still reports the size it reached.
  const leave = useRef(commit);
  leave.current = commit;
  useEffect(() => () => leave.current(), []);
  const act = (action: SplitKeyAction) => {
    const now = current.current;
    if (now.disabled || now.total <= hit) return;
    moveTo(splitKeyTarget(action, pxNow(), now.limits, splitFromRatio(splitShare(now.defaultSize), now.total, hit)));
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
      moveTo(start.current + (now.vertical ? gesture.dy : now.rtl ? -gesture.dx : gesture.dx));
    },
    onPanResponderRelease: () => { setDragging(false); commit(); },
    onPanResponderTerminate: () => { setDragging(false); commit(); },
  }), []);
  const percent = (value: number) => splitPercent(value, total, hit);
  const now = px === null ? Math.round(wanted * 100) : percent(px);
  const low = px === null ? 0 : percent(limits.low), high = px === null ? 100 : percent(limits.high);
  const along = vertical ? "height" : "width", across = vertical ? "width" : "height";
  const barLength = dragging ? geometry.activeBarLength : geometry.barLength;
  const pane: ViewStyle = { minWidth: 0, minHeight: 0, overflow: "hidden" };
  return (
    <View onLayout={event => {
      const next = event.nativeEvent.layout[along];
      if (Math.abs(next - total) > 0.5) setTotal(next);
    }} style={[{ flexDirection: vertical ? "column" : "row", width: "100%", minWidth: 0, minHeight: 0 }, vertical && { height: "100%" }, style]}>
      {/* Before the first layout the panes share the room by the asked ratio; afterwards the first pane has its points. */}
      <View style={[pane, px === null ? { flexGrow: Math.max(0, wanted), flexBasis: 0 } : { [along]: px }]}>{first}</View>
      <View {...responder.panHandlers} style={{ [along]: hit, alignSelf: "stretch", borderRadius: tokens.radius.radius8,
        backgroundColor: dragging ? colors.hover : undefined,
        ...(Platform.OS === "web" ? ({ cursor: disabled ? "default" : vertical ? "row-resize" : "col-resize", touchAction: "none", userSelect: "none" } as unknown as ViewStyle) : {}) }}>
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel={ariaLabel}
          accessibilityState={{ disabled }}
          accessibilityValue={{ min: low, max: high, now }}
          accessibilityActions={[{ name: "increment", label: m.increase }, { name: "decrement", label: m.decrease }]}
          onAccessibilityAction={event => act(event.nativeEvent.actionName === "increment" ? "increase" : "decrease")}
          disabled={disabled}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onFocus={event => { if (focusVisible(event.currentTarget)) setFocused(true); }}
          onBlur={() => setFocused(false)}
          {...(Platform.OS === "web" ? {
            "aria-valuenow": now, "aria-valuemin": low, "aria-valuemax": high, "aria-orientation": vertical ? "horizontal" : "vertical", "aria-disabled": disabled,
            onKeyDown: (event: any) => {
              const action = splitKeyAction(event.key, direction, rtl);
              if (!action || disabled || splitKeyHeld(event)) return;
              event.preventDefault();
              act(action);
            },
          } : {})}
          style={{ flex: 1, alignItems: "center", justifyContent: "center", borderRadius: tokens.radius.radius8,
            ...(Platform.OS === "web" ? ({ outlineStyle: "solid", outlineWidth: focused ? tokens.states.focus.width : 0,
              outlineOffset: -tokens.states.focus.width, outlineColor: colors.focusRing, cursor: "inherit" } as unknown as ViewStyle) : {}) }}>
          <View pointerEvents="none" style={{ [across]: barLength, [along]: geometry.barWidth, borderRadius: tokens.radius.radius9999,
            backgroundColor: disabled ? colors.border : dragging || focused ? colors.text : hovered ? colors.textTertiary : colors.borderStrong ?? colors.border }} />
        </Pressable>
      </View>
      <View style={[pane, px === null ? { flexGrow: Math.max(0, 1 - wanted), flexBasis: 0 } : { flex: 1 }]}>{second}</View>
    </View>
  );
}
