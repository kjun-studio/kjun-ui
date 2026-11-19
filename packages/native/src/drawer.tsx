import { useAfterClose } from "../../../shared/package-runtime/use-after-close";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { LayerBackdrop, screenCover } from "./layer-backdrop";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { directionalShadow } from "../../../shared/package-runtime/elevation";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Keyboard, PanResponder, Platform, ScrollView, View, useWindowDimensions, type ScrollViewProps, type ViewStyle } from "react-native";
import { drawerFrame, keyboardEvents, keyboardOverlap } from "../../../shared/package-runtime/drawer-geometry";
import { sheetDragDismisses, sheetDragOffset } from "../../../shared/package-runtime/sheet-drag";
import { useNativePresence, motionEmphasized, nativeDriver } from "./motion";
import { KjunButton, KjunIcon } from "./button";
import { layerFooterItems } from "./modal";
import { KText,content } from "./internal";
import { ScopedNativeModal } from "./overlay-host";
import { useKjunSafeArea, useKjunStyles } from "./provider";

export interface KjunDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  position?: "left" | "right" | "top" | "bottom";
  width?: number;
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  noPadding?: boolean;
  header?: ReactNode;
  /** Secondary actions in the title row, before the close button (such as a reset button). */
  headerActions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** Replaces the body's scroller with the app's own, such as a FlatList that draws only its visible rows or a ScrollView
   * whose ref and scroll events the app needs. It receives the props the drawer gives its own scroller (the body's size and
   * padding, keyboard taps, and children when there are any); spread them onto the scroller. The header, footer, size and
   * safe area stay the drawer's. */
  renderScrollView?: (props: ScrollViewProps) => ReactNode;
  onClose?: () => void;
  /** Called once after the close finishes and the layer has left the screen (not when it mounts closed or reopens during the exit). */
  onAfterClose?: () => void;
  ariaLabel?: string;
  /** Id of the element that describes the drawer (React Native Web aria-describedby). */
  ariaDescribedBy?: string;
  /** Bottom drawers: a grab handle above the header; dragging the handle or header down closes the drawer. */
  handle?: boolean;
  /** Keeps clear of KjunProvider's safe area (default true): padded inside the panel and kept clear beyond a sheet. */
  safeArea?: boolean;
  /** Height limit for top and bottom drawers; by default they stop a sheet gap short of the opposite edge. */
  maxHeight?: number;
  /** Keeps the panel above the on-screen keyboard (devices only). */
  avoidKeyboard?: boolean;
}
// How much of the modal root the keyboard covers while enabled. React Native Web has no keyboard.
function useKeyboardOverlap(enabled: boolean, rootHeight: number) {
  const [overlap, setOverlap] = useState(0);
  useEffect(() => {
    setOverlap(0);
    const events = keyboardEvents(Platform.OS);
    if (!enabled || !events) return;
    const metrics = Keyboard.metrics?.();
    if (metrics) setOverlap(keyboardOverlap(rootHeight, metrics.screenY));
    const show = Keyboard.addListener(events.show, event => setOverlap(keyboardOverlap(rootHeight, event.endCoordinates.screenY)));
    const hide = Keyboard.addListener(events.hide, () => setOverlap(0));
    return () => { show.remove(); hide.remove(); };
  }, [enabled, rootHeight]);
  return overlap;
}
export function KjunDrawer({
  open,
  onOpenChange,
  title,
  position = "right",
  width = tokens.extensions.drawer.width,
  closable = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  noPadding = false,
  header,
  headerActions,
  footer,
  children,
  renderScrollView,
  onClose,
  onAfterClose,
  ariaLabel,
  ariaDescribedBy,
  handle = false,
  safeArea = true,
  maxHeight,
  avoidKeyboard = true,
}: KjunDrawerProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    insets = useKjunSafeArea(),
    safeAreaTop = safeArea ? insets.top : 0,
    safeAreaBottom = safeArea ? insets.bottom : 0,
    window = useWindowDimensions(),
    sideways = position === "left" || position === "right",
    geometry = tokens.extensions.drawer,
    compact = window.width <= tokens.responsive.drawer,
    // Phones: a side drawer leaves the sheet gap of page visible. Wider screens: sheets stop at a readable width, centered.
    panelWidth = sideways ? Math.min(width, window.width - (compact ? geometry.sheetGap : 0))
      : compact ? window.width : Math.min(window.width, geometry.sheetMaxWidth),
    sheetRadius = (edge: "top" | "bottom") => sideways || position === edge ? geometry.radius : geometry.sheetRadius,
    // Without a title or header only the close button remains: no title band, no empty text.
    titled = !!title || hasContent(header),
    hasActions = hasContent(headerActions),
    grab = handle && position === "bottom";
  // The modal root's own height: a resizing Android window shrinks it for the keyboard; elsewhere it equals the window.
  const [rootHeight, setRootHeight] = useState(0);
  const keyboard = useKeyboardOverlap(open && avoidKeyboard, rootHeight || window.height);
  const frame = drawerFrame({ position, windowHeight: rootHeight || window.height, safeAreaTop, safeAreaBottom,
    gap: tokens.extensions.drawer.sheetGap, keyboard, maxHeight });
  const [panelHeight, setPanelHeight] = useState(0);
  const motion = useNativePresence(open, tokens.motion.layerEnter, tokens.motion.layerExit, sideways || panelHeight > 0, 0, { enterEasing: motionEmphasized });
  // The backdrop waits with the panel, so a sheet still being measured never shows a dimmed screen alone.
  const backdrop = useNativePresence(open, tokens.motion.backdrop, tokens.motion.backdropExit, sideways || panelHeight > 0, 0, { fade: tokens.motion.backdropExit });
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  // Handle drag: the sheet follows a downward drag of the handle or header and closes past the dismiss distance or on a flick.
  const drag = useRef(new Animated.Value(0)).current;
  const [dragging, setDragging] = useState(false);
  const latest = useRef({ close, panelHeight, enabled: false });
  latest.current = { close, panelHeight, enabled: grab && open };
  useEffect(() => { if (open) drag.setValue(0); }, [open, drag]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, g) => latest.current.enabled && g.dy > 0 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: (_event, g) => drag.setValue(sheetDragOffset(g.dy, latest.current.panelHeight)),
    onPanResponderRelease: (_event, g) => {
      setDragging(false);
      const offset = sheetDragOffset(g.dy, latest.current.panelHeight);
      // Closing keeps the dropped position: the exit continues from there.
      if (sheetDragDismisses(offset, g.vy, geometry.dismissDistance)) latest.current.close();
      else Animated.timing(drag, { toValue: 0, duration: tokens.motion.layerEnter, easing: motionEmphasized, useNativeDriver: nativeDriver }).start();
    },
    onPanResponderTerminate: () => {
      setDragging(false);
      Animated.timing(drag, { toValue: 0, duration: tokens.motion.layerEnter, easing: motionEmphasized, useNativeDriver: nativeDriver }).start();
    },
  }), [drag, geometry.dismissDistance]);
  const dragArea = grab ? pan.panHandlers : {};
  // A mouse drag on Native Web would select the title, and React Native Web ends the gesture when a selection starts.
  const dragSurface = grab && Platform.OS === "web" ? ({ userSelect: "none" } as ViewStyle) : null;
  const dragFade = drag.interpolate({ inputRange: [0, Math.max(panelHeight, 1)], outputRange: [1, 0], extrapolate: "clamp" });
  // iOS keeps dismissing the native window after visible turns false; report once it is gone so the next sheet can open.
  const iosDismiss = Platform.OS === "ios";
  useAfterClose(motion.present, onAfterClose, !iosDismiss);
  // What the body's scroller gets, whether it is the drawer's own ScrollView or the app's (renderScrollView).
  const scroller: ScrollViewProps = {
    keyboardShouldPersistTaps: "handled",
    style: sideways ? { flex: 1 } : { flexGrow: 0, flexShrink: 1 },
    // No dividers, as on the web: the header's and the body's own padding space them, so the body drops its top padding
    // under a title and its bottom padding above a footer.
    contentContainerStyle: noPadding ? { padding: 0 } : { padding: geometry.bodyPadding,
      ...(titled ? { paddingTop: 0 } : closable ? { paddingTop: geometry.bareBodyPaddingTop } : {}) },
    ...(hasContent(children) ? { children: content(children) } : {}),
  };
  return (
    <LayerScope.Provider value={layer.id}>
    <ScopedNativeModal
      visible={motion.present}
      onDismiss={iosDismiss ? () => { if (!open) onAfterClose?.(); } : undefined}
      transparent
      onRequestClose={() => {
        if (closeOnEsc) close();
      }}
      animationType="none"
      // Like KjunModal: the window starts at the screen top, so keyboard overlap and safeAreaTop measure from y=0.
      statusBarTranslucent
    >
      <View
        onLayout={event => setRootHeight(event.nativeEvent.layout.height)}
        style={{
          flex: 1,
          justifyContent: position === "bottom" ? "flex-end" : "flex-start",
          alignItems: !sideways ? "center" : position === "right" ? "flex-end" : "flex-start",
        }}
      >
        <Animated.View pointerEvents={open ? "auto" : "none"} style={{ ...screenCover(), opacity: grab ? Animated.multiply(backdrop.opacity, dragFade) : backdrop.opacity }}>
        <LayerBackdrop
          onPress={() => {
            if (closeOnOverlay) close();
          }}
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: colors.overlay,
          }}
        />
        </Animated.View>
        <Animated.View
          pointerEvents={open ? "auto" : "none"}
          accessibilityElementsHidden={!open}
          importantForAccessibility={open ? "auto" : "no-hide-descendants"}
          {...(!open ? { inert: true } : {})}
          ref={node => { const entry = layer.state.entries.get(layer.id); if (entry && node && typeof node === 'object' && 'focus' in node) entry.root = node; }}
          accessibilityViewIsModal
          accessibilityLabel={ariaLabel || title || m.panel}
          {...(Platform.OS === "web"
            ? { role: "dialog", "aria-modal": true, ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}) }
            : {})}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            opacity: sideways || panelHeight > 0 ? 1 : 0,
            transform: sideways ? [{ translateX: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "left" ? -1 : 1) * panelWidth, 0] }) }]
              : [{ translateY: Animated.add(motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "top" ? -1 : 1) * panelHeight, 0] }), grab ? drag : 0) }],
            width: panelWidth,
            height: frame.height,
            maxHeight: frame.maxHeight,
            paddingTop: frame.paddingTop,
            paddingBottom: frame.paddingBottom,
            marginBottom: frame.lift,
            // Sheets round the corners that face the page.
            borderTopLeftRadius: sheetRadius("top"),
            borderTopRightRadius: sheetRadius("top"),
            borderBottomLeftRadius: sheetRadius("bottom"),
            borderBottomRightRadius: sheetRadius("bottom"),
            boxShadow: directionalShadow(tokens.extensions.drawer.elevation, position).map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
            backgroundColor: colors.surface,
          }}
        >
          {grab && (
            <View {...dragArea} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
              style={{ alignItems: "center", paddingTop: geometry.handleSpace, ...dragSurface }}>
              <View style={{ width: geometry.handleWidth, height: geometry.handleHeight, borderRadius: geometry.handleRadius,
                backgroundColor: dragging ? colors.textTertiary : colors.borderStrong }} />
            </View>
          )}
          {(titled || closable || hasActions) && (
            <View
              {...dragArea}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: titled ? "space-between" : "flex-end",
                paddingTop: grab ? geometry.handleSpace : geometry.paddingY,
                paddingBottom: titled ? geometry.paddingY : 0,
                paddingHorizontal: geometry.paddingX,
                ...dragSurface,
              }}
            >
              {titled && (
                <View style={{ flex: 1, paddingRight: geometry.titleActionGap }}>
                  {hasContent(header) ? content(header) : <KText accessibilityRole="header" style={typeStyle('sectionTitle')}>{title}</KText>}
                </View>
              )}
              {(hasActions || closable) && (
                // The last glyph sits on the content edge; its button inset hangs into the header padding.
                <View style={{ flexDirection: "row", alignItems: "center", gap: geometry.headerActionGap, marginRight: (geometry.closeIconSize - geometry.closeSize) / 2 }}>
                  {hasActions && content(headerActions)}
                  {closable && (
                    <KjunButton
                      size="sm"
                      variant="ghost"
                      ariaLabel={m.close}
                      onPress={close}
                      style={{ borderRadius: geometry.closeRadius, width: geometry.closeSize, height: geometry.closeSize, minWidth: 0, paddingHorizontal: 0, paddingVertical: 0 }}
                    ><KjunIcon name="x" size={geometry.closeIconSize} /></KjunButton>
                  )}
                </View>
              )}
            </View>
          )}
          {renderScrollView ? renderScrollView(scroller) : <ScrollView {...scroller} />}
          {hasContent(footer) && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                gap: geometry.footerGap,
                paddingTop: noPadding ? geometry.paddingY : 0,
                paddingBottom: geometry.paddingY,
                paddingHorizontal: geometry.paddingX,
              }}
            >
              {layerFooterItems(footer, compact && position === "bottom")}
            </View>
          )}
        </Animated.View>
      </View>
    </ScopedNativeModal>
    </LayerScope.Provider>
  );
}
