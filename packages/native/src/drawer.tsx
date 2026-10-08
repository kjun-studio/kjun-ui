import { LayerBackdrop } from "./layer-backdrop";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { directionalShadow } from "../../../shared/package-runtime/elevation";
import { typeStyle } from "./typography";
import { tokens } from "@kjun/tokens";
import { useState } from "react";
import { Animated } from "react-native";
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
import { DsButton, DsIcon } from "./button";
import { KText,content } from "./internal";
import { ScopedNativeModal } from "./overlay-host";
import { useKjunStyles } from "./provider";

export interface DsDrawerProps {
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
  ariaLabel?: string;
}
export function DsDrawer({
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
  ariaLabel,
}: DsDrawerProps) {
  const { colors } = useKjunStyles(),
    window = useWindowDimensions(),
    vertical = position === "left" || position === "right";
  const [panelHeight, setPanelHeight] = useState(0);
  const motion = useNativePresence(open, tokens.motion.layerEnter, tokens.motion.layerExit, vertical || panelHeight > 0, 0, { enterEasing: motionEmphasized });
  const backdrop = useNativePresence(open, tokens.motion.backdrop, tokens.motion.backdropExit, true, 0, { fade: tokens.motion.backdropExit });
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  return (
    <LayerScope.Provider value={layer.id}>
    <ScopedNativeModal
      visible={motion.present}
      transparent
      onRequestClose={() => {
        if (closeOnEsc) close();
      }}
      animationType="none"
    >
      <View
        style={{
          flex: 1,
          justifyContent: position === "bottom" ? "flex-end" : "flex-start",
          alignItems: position === "right" ? "flex-end" : "flex-start",
        }}
      >
        <Animated.View pointerEvents={open ? "auto" : "none"} style={{ position: "absolute", inset: 0, opacity: backdrop.opacity }}>
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
          accessibilityLabel={ariaLabel || title || "패널"}
          {...(Platform.OS === "web"
            ? { role: "dialog", "aria-modal": true }
            : {})}
          onLayout={event => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            opacity: vertical || panelHeight > 0 ? 1 : 0,
            transform: vertical ? [{ translateX: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "left" ? -1 : 1) * Math.min(width, window.width), 0] }) }]
              : [{ translateY: motion.progress.interpolate({ inputRange: [0, 1], outputRange: [(position === "top" ? -1 : 1) * panelHeight, 0] }) }],
            width: vertical ? Math.min(width, window.width) : window.width,
            height: vertical ? window.height : undefined,
            maxHeight: window.height,
            borderRadius: tokens.extensions.drawer.radius,
            borderTopLeftRadius: position === "bottom" ? tokens.extensions.drawer.bottomRadius : tokens.extensions.drawer.radius,
            borderTopRightRadius: position === "bottom" ? tokens.extensions.drawer.bottomRadius : tokens.extensions.drawer.radius,
            boxShadow: directionalShadow(tokens.extensions.drawer.elevation, position).map(({ colorRole, ...layer }) => ({ ...layer, color: colors[colorRole] })),
            backgroundColor: colors.surface,
          }}
        >
          {(title || header || closable) && (
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
                {header || (
                  <KText
                    style={{ ...typeStyle('sectionTitle'),   }}
                  >
                    {title}
                  </KText>
                )}
              </View>
              {closable && (
                <DsButton
                  size="sm"
                  variant="ghost"
                  ariaLabel="닫기"
                  onPress={close}
                  style={{ borderRadius: tokens.extensions.drawer.closeRadius, width: tokens.extensions.drawer.closeSize, height: tokens.extensions.drawer.closeSize, paddingHorizontal: 0, paddingVertical: 0 }}
                ><DsIcon name="x" size={tokens.extensions.drawer.closeIconSize} /></DsButton>
              )}
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={vertical ? { flex: 1 } : { flexGrow: 0 }}
            contentContainerStyle={{ padding: noPadding ? 0 : tokens.extensions.drawer.bodyPadding }}
          >
            {content(children)}
          </ScrollView>
          {footer && (
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
