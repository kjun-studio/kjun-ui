import { useAfterClose } from "../../../shared/package-runtime/use-after-close";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { LayerBackdrop, screenCover } from "./layer-backdrop";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { directionalShadow } from "../../../shared/package-runtime/elevation";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import { useEffect, useState } from "react";
import { Animated, Keyboard } from "react-native";
import { drawerFrame, keyboardEvents, keyboardOverlap } from "../../../shared/package-runtime/drawer-geometry";
import { useNativePresence, motionEmphasized } from "./motion";
import {
type ReactNode
} from "react";
import {
Platform,
ScrollView,
View,
useWindowDimensions
} from "react-native";
import { KjunButton, KjunIcon } from "./button";
import { KText,content } from "./internal";
import { ScopedNativeModal } from "./overlay-host";
import { useKjunStyles } from "./provider";

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
  footer?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
  /** Called once after the close finishes and the layer has left the screen (not when it mounts closed or reopens during the exit). */
  onAfterClose?: () => void;
  ariaLabel?: string;
  /** Top safe area, padded inside top and side drawers and kept clear above a bottom sheet. */
  safeAreaTop?: number;
  /** Bottom safe area, padded inside bottom and side drawers and kept clear below a top sheet. */
  safeAreaBottom?: number;
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
  footer,
  children,
  onClose,
  onAfterClose,
  ariaLabel,
  safeAreaTop = 0,
  safeAreaBottom = 0,
  maxHeight,
  avoidKeyboard = true,
}: KjunDrawerProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    window = useWindowDimensions(),
    vertical = position === "left" || position === "right";
  // The modal root's own height: a resizing Android window shrinks it for the keyboard; elsewhere it equals the window.
  const [rootHeight, setRootHeight] = useState(0);
  const keyboard = useKeyboardOverlap(open && avoidKeyboard, rootHeight || window.height);
  const frame = drawerFrame({ position, windowHeight: rootHeight || window.height, safeAreaTop: Math.max(0, safeAreaTop), safeAreaBottom: Math.max(0, safeAreaBottom),
    gap: tokens.extensions.drawer.sheetGap, keyboard, maxHeight });
  const [panelHeight, setPanelHeight] = useState(0);
  const motion = useNativePresence(open, tokens.motion.layerEnter, tokens.motion.layerExit, vertical || panelHeight > 0, 0, { enterEasing: motionEmphasized });
  // The backdrop waits with the panel, so a sheet still being measured never shows a dimmed screen alone.
  const backdrop = useNativePresence(open, tokens.motion.backdrop, tokens.motion.backdropExit, vertical || panelHeight > 0, 0, { fade: tokens.motion.backdropExit });
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  // iOS keeps dismissing the native window after visible turns false; report once it is gone so the next sheet can open.
  const iosDismiss = Platform.OS === "ios";
  useAfterClose(motion.present, onAfterClose, !iosDismiss);
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
          alignItems: position === "right" ? "flex-end" : "flex-start",
        }}
      >
        <Animated.View pointerEvents={open ? "auto" : "none"} style={{ ...screenCover(), opacity: backdrop.opacity }}>
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
            ? { role: "dialog", "aria-modal": true }
            : {})}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            opacity: vertical || panelHeight > 0 ? 1 : 0,
            transform: vertical ? [{ translateX: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "left" ? -1 : 1) * Math.min(width, window.width), 0] }) }]
              : [{ translateY: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "top" ? -1 : 1) * panelHeight, 0] }) }],
            width: vertical ? Math.min(width, window.width) : window.width,
            height: frame.height,
            maxHeight: frame.maxHeight,
            paddingTop: frame.paddingTop,
            paddingBottom: frame.paddingBottom,
            marginBottom: frame.lift,
            borderRadius: tokens.extensions.drawer.radius,
            borderTopLeftRadius: position === "bottom" ? tokens.extensions.drawer.bottomRadius : tokens.extensions.drawer.radius,
            borderTopRightRadius: position === "bottom" ? tokens.extensions.drawer.bottomRadius : tokens.extensions.drawer.radius,
            boxShadow: directionalShadow(tokens.extensions.drawer.elevation, position).map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
            backgroundColor: colors.surface,
          }}
        >
          {!!(title || header || closable) && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: tokens.extensions.drawer.paddingY,
                paddingHorizontal: tokens.extensions.drawer.paddingX,
                borderBottomWidth: tokens.border.defaultWidth,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1 }}>
                {hasContent(header) ? content(header) : (
                  <KText
                    style={{ ...typeStyle('sectionTitle'),   }}
                  >
                    {title}
                  </KText>
                )}
              </View>
              {closable && (
                <KjunButton
                  size="sm"
                  variant="ghost"
                  ariaLabel={m.close}
                  onPress={close}
                  style={{ borderRadius: tokens.extensions.drawer.closeRadius, width: tokens.extensions.drawer.closeSize, height: tokens.extensions.drawer.closeSize, paddingHorizontal: 0, paddingVertical: 0 }}
                ><KjunIcon name="x" size={tokens.extensions.drawer.closeIconSize} /></KjunButton>
              )}
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={vertical ? { flex: 1 } : { flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ padding: noPadding ? 0 : tokens.extensions.drawer.bodyPadding }}
          >
            {content(children)}
          </ScrollView>
          {hasContent(footer) && (
            <View
              style={{
                paddingVertical: tokens.extensions.drawer.paddingY,
                paddingHorizontal: tokens.extensions.drawer.paddingX,
                borderTopWidth: tokens.border.defaultWidth,
                borderTopColor: colors.border,
              }}
            >
              {content(footer)}
            </View>
          )}
        </Animated.View>
      </View>
    </ScopedNativeModal>
    </LayerScope.Provider>
  );
}
