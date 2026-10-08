import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { createFeedbackController,type ToastItem } from "@kjun-ui/tokens";
import { useEffect,useRef } from "react";
import { Animated,View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIcon } from "./button";
import { KText,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
export function ToastView({
  toast,
  controller,
}: {
  toast: ToastItem;
  controller: ReturnType<typeof createFeedbackController>;
}) {
  const { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    progress = useRef(new Animated.Value(1)).current;
  const reasons = useRef({ hover: Symbol("hover"), actionHover: Symbol("actionHover"),
    closeHover: Symbol("closeHover"), focus: Symbol("focus") }).current;
  useEffect(() => () => {
    for (const reason of Object.values(reasons)) controller.resumeToast(toast.id, reason);
  }, [controller, toast.id, reasons]);
  const tone = toast.type === "error" ? "danger" : toast.type || "info",
    icon = {
      success: "circle-check",
      danger: "alert-circle",
      warning: "alert-triangle",
      info: "info-circle",
    }[tone];
  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(toast.duration ? toast.remaining / toast.duration : 1);
    if (!toast.paused && !reduced) {
      Animated.timing(progress, {
        toValue: 0,
        duration: toast.remaining,
        useNativeDriver: false,
      }).start();
    }
    return () => progress.stopAnimation();
  }, [toast.remaining, toast.startedAt, toast.paused, reduced, progress]);
  const dismiss = () => controller.api.toast.dismiss(toast.id);
  return (
    <Pressable
      accessible={false}
      onHoverIn={() => controller.pauseToast(toast.id, reasons.hover)}
      onHoverOut={() => controller.resumeToast(toast.id, reasons.hover)}
      style={{ width: "100%", maxWidth: tokens.extensions.toast.maxWidth, alignSelf: "flex-end" }}
    >
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion={tone === "danger" ? "assertive" : "polite"}
        style={{
          flexDirection: "row",
          alignItems: toast.title ? "flex-start" : "center",
          gap: tokens.extensions.toast.gap,
          padding: tokens.extensions.toast.padding,
          borderRadius: tokens.extensions.toast.radius,
          backgroundColor: colors.surface,
          boxShadow: shadowLayers(tokens.extensions.toast.elevation, colors),
          borderWidth: tokens.border.defaultWidth,
          borderColor: colors.border,
          overflow: "hidden",
        }}
      >
        <DsIcon name={icon} color={colors[`${tone}Accent`]} />
        <View style={{ flex: 1, minWidth: 0 }}>
          {toast.title && (
            <KText style={{ fontWeight: typeStyle('control').fontWeight, marginBottom: tokens.extensions.toast.titleGap }}>
              {toast.title}
            </KText>
          )}
          <KText style={{ color: colors.textSecondary }}>{toast.message}</KText>
          {toast.action && (
            <Pressable
              accessibilityRole="button"
              // Nested Pressables own their hover gesture in Native Web.
              onHoverIn={() => controller.pauseToast(toast.id, reasons.actionHover)}
              onHoverOut={() => controller.resumeToast(toast.id, reasons.actionHover)}
              onFocus={() => controller.pauseToast(toast.id, reasons.focus)}
              onBlur={() => controller.resumeToast(toast.id, reasons.focus)}
              onPress={() => {
                try {
                  toast.action?.onClick();
                } finally {
                  dismiss();
                }
              }}
              style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center", marginTop: tokens.extensions.toast.actionGap }}
            >
              <KText
                style={{ ...typeStyle('label'),  color: colors.brand }}
              >
                {toast.action.label}
              </KText>
            </Pressable>
          )}
        </View>
        {toast.closable !== false && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림 닫기"
            onHoverIn={() => controller.pauseToast(toast.id, reasons.closeHover)}
            onHoverOut={() => controller.resumeToast(toast.id, reasons.closeHover)}
            onFocus={() => controller.pauseToast(toast.id, reasons.focus)}
            onBlur={() => controller.resumeToast(toast.id, reasons.focus)}
            onPress={dismiss}
            style={{
              minWidth: Math.max(tokens.extensions.toast.closeSize, tokens.native.minimumTouchTarget),
              minHeight: Math.max(tokens.extensions.toast.closeSize, tokens.native.minimumTouchTarget),
              alignItems: "center",
              justifyContent: "center",
              borderRadius: tokens.extensions.toast.closeRadius,
            }}
          >
            <DsIcon name="x" color={colors.textTertiary} />
          </Pressable>
        )}
        {toast.showProgress !== false && !!toast.duration && (
          <Animated.View
            accessible={false}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: tokens.extensions.toast.progressHeight,
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
              backgroundColor: colors[tone],
            }}
          />
        )}
      </View>
    </Pressable>
  );
}
