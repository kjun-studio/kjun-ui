import { LayerBackdrop } from "./layer-backdrop";
import { LayerScope, useLayer } from "../../../shared/package-runtime/use-layer";
import { typeStyle } from "./typography";
import { useLayoutEffect, useState } from "react";
import { FormActionsContext } from "./form-actions-context";
import { formActionsNeedStack } from "../../../shared/package-runtime/form-actions";
import { Animated } from "react-native";
import { useNativePresence, useMotionValue, motionIn, motionOut } from "./motion";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import {
KeyboardAvoidingView,
Platform,
ScrollView,
Text,
useWindowDimensions,
View
} from "react-native";
import { DsButton, DsIcon } from "./button";
import { ScopedNativeModal } from "./overlay-host";
import { useKjunStyles } from "./provider";
export interface DsFormActionsProps {
  size?: InputSize;
  cancelText?: string;
  confirmText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  cancelDisabled?: boolean;
  confirmDisabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "danger" | "success";
  cancelVariant?: "ghost" | "secondary";
  onCancel?: () => void;
  onConfirm?: () => void;
}
export function DsFormActions({
  size = "lg",
  cancelText = "취소",
  confirmText = "저장",
  showCancel = true,
  showConfirm = true,
  cancelDisabled = false,
  confirmDisabled = false,
  loading = false,
  variant = "primary",
  cancelVariant = "ghost",
  onCancel,
  onConfirm,
}: DsFormActionsProps) {
  const { fontFamily } = useKjunStyles();
  const [width, setWidth] = useState(0), [measurements, setMeasurements] = useState<Record<string, number>>({});
  const labels = [showCancel && { text: cancelText }, showConfirm && { text: confirmText }].filter(Boolean) as { text: string }[];
  const keyFor = (text: string) => `${fontFamily}:${size}:${text}`;
  const widths = labels.map(label => measurements[keyFor(label.text)] === undefined ? 0 :
    Math.max(tokens.button.minWidths[size], measurements[keyFor(label.text)] + tokens.button.paddingX[size] * 2));
  const stacked = formActionsNeedStack(width, widths, tokens.modal.actionsGap);
  return (
    <FormActionsContext.Provider value={{ stacked }}>
    <View
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: stacked ? "column" : "row",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        alignItems: stacked ? "stretch" : "center",
        gap: tokens.modal.actionsGap,
        width: "100%", maxWidth: "100%", minWidth: 0,
      }}
    >
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: 0, overflow: 'hidden', opacity: 0, flexDirection: 'row' }}>
        {labels.map((label, index) => <Text key={index + keyFor(label.text)} numberOfLines={1}
          onLayout={event => { const value = event.nativeEvent.layout.width; setMeasurements(old => old[keyFor(label.text)] === value ? old : { ...old, [keyFor(label.text)]: value }); }}
          style={{ fontFamily, ...typeStyle(tokens.button.typography[size]), flexShrink: 0 }}>{label.text}</Text>)}
      </View>
      {showCancel && (
        <DsButton
          size={size}
          variant={cancelVariant}
          disabled={cancelDisabled}
          onPress={onCancel}
        >
          {cancelText}
        </DsButton>
      )}
      {showConfirm && (
        <DsButton
          size={size}
          variant={variant}
          disabled={confirmDisabled}
          loading={loading}
          onPress={onConfirm}
        >
          {confirmText}
        </DsButton>
      )}
    </View>
    </FormActionsContext.Provider>
  );
}
export interface DsModalProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm?: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  noPadding?: boolean;
  height?: number;
  confirmVariant?: "primary" | "danger" | "success";
  footerSize?: InputSize;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  ariaLabel?: string;
}
export function DsModal({
  open,
  onOpenChange,
  onClose,
  onCancel,
  onConfirm,
  title = "",
  size = "md",
  closable = true,
  closeOnOverlay = true,
  closeOnEsc = true,
  showHeader = true,
  showFooter = false,
  showConfirmButton = true,
  showCancelButton = true,
  confirmText = "확인",
  cancelText = "취소",
  confirmDisabled = false,
  loading = false,
  noPadding = false,
  height,
  confirmVariant = "primary",
  footerSize = "md",
  header,
  footer,
  children,
  ariaLabel,
}: DsModalProps) {
  const { colors: c, fontFamily } = useKjunStyles();
  const window = useWindowDimensions();
  const motion = useNativePresence(open, tokens.motion.layerEnter, tokens.motion.layerExit, true, 0, { fade: tokens.motion.backdropExit });
  const offset = useMotionValue(open ? 0 : tokens.motionDistance.modalExit, open ? tokens.motion.layerEnter : tokens.motion.layerExit, tokens.motionDistance.modalEnter, open ? motionOut : motionIn, true);
  const backdrop = useNativePresence(open, tokens.motion.backdrop, tokens.motion.backdropExit, true, 0, { fade: tokens.motion.backdropExit });
  useLayoutEffect(() => { if (!motion.present) { offset.stopAnimation(); offset.setValue(tokens.motionDistance.modalEnter); } }, [motion.present, offset]);
  const close = () => {
    if (!open) return;
    onOpenChange(false);
    onClose?.();
  };
  const width =
    size === "full"
      ? window.width - 2 * tokens.modal.mobileInset
      : window.width <= tokens.responsive.modal
      ? window.width - 2 * tokens.modal.mobileInset
      : Math.min(tokens.modal.widths[size], window.width - 2 * tokens.modal.mobileInset);
  const layer = useLayer(open, motion.present, "window", () => { if (closeOnEsc) close(); });
  return (
    <LayerScope.Provider value={layer.id}>
    <ScopedNativeModal
      visible={motion.present}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (closeOnEsc) close();
      }}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: tokens.modal.mobileInset,
        }}
      >
        <Animated.View pointerEvents={open ? "auto" : "none"} style={{ position: "absolute", inset: 0, opacity: backdrop.opacity }}>
        <LayerBackdrop
          onPress={() => {
            if (closeOnOverlay) close();
          }}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: c.overlay,
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
          accessibilityLabel={ariaLabel || title || "대화상자"}
          {...(Platform.OS === "web"
            ? { role: "dialog", "aria-modal": true }
            : {})}
          style={{
            opacity: motion.opacity,
            transform: [{ translateY: offset }],
            width,
            maxHeight:
              window.width <= tokens.responsive.modal && size !== "full"
                ? window.height * 0.85
                : window.height - 2 * tokens.modal.mobileInset,
            height:
              height || (size === "full" ? window.height - 2 * tokens.modal.mobileInset : undefined),
            backgroundColor: c.surface,
            borderRadius: tokens.modal.radius,
            overflow: "hidden",
            boxShadow: tokens.modal.elevation.map(({ colorRole, ...layer }) => ({ ...layer, color: c[colorRole] })),
          }}
        >
          {showHeader && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: tokens.modal.padding,
                paddingVertical: tokens.modal.headerPaddingY,
                borderBottomWidth: tokens.border.defaultWidth,
                borderBottomColor: c.border,
              }}
            >
              <View style={{ flex: 1, paddingRight: tokens.modal.titleActionGap }}>
                {header || (
                  <Text
                    accessibilityRole="header"
                    style={{
                      fontFamily,
                      ...typeStyle({ ...tokens.typography.sectionTitle, fontSizePx: tokens.modal.titleSize,
                        lineHeightPx: tokens.modal.titleLineHeight, fontWeight: tokens.modal.titleWeight }),
                      color: c.text,
                    }}
                  >
                    {title}
                  </Text>
                )}
              </View>
              {closable && (
                <DsButton
                  variant="ghost"
                  size="sm"
                  ariaLabel="닫기"
                  onPress={close}
                  style={{ borderRadius: tokens.modal.closeRadius, width: tokens.modal.closeSize, height: tokens.modal.closeSize, paddingHorizontal: 0, paddingVertical: 0 }}
                ><DsIcon name="x" size={tokens.modal.closeIconSize} /></DsButton>
              )}
            </View>
          )}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: noPadding ? 0 : tokens.modal.padding }}
            style={{ flexGrow: 0, flexShrink: 1 }}
          >
            {children}
          </ScrollView>
          {(showFooter || footer) && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
                gap: tokens.modal.footerGap,
                paddingVertical: tokens.modal.headerPaddingY,
                paddingHorizontal: tokens.modal.padding,
                borderTopWidth: tokens.border.defaultWidth,
                borderTopColor: c.border,
              }}
            >
              {footer || (
                <DsFormActions
                  size={footerSize}
                  cancelVariant="secondary"
                  showCancel={showCancelButton}
                  showConfirm={showConfirmButton}
                  cancelText={cancelText}
                  confirmText={confirmText}
                  confirmDisabled={confirmDisabled}
                  loading={loading}
                  variant={confirmVariant}
                  onConfirm={onConfirm}
                  onCancel={() => {
                    onCancel?.();
                    close();
                  }}
                />
              )}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </ScopedNativeModal>
    </LayerScope.Provider>
  );
}
