import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { shadowLayers } from "../../../shared/package-runtime/elevation";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { createFeedbackController,type ToastItem } from "@kjun-ui/tokens";
import { toastPresentation, toastSwipeDistance } from "../../../shared/package-runtime/toast-presentation";
import { useEffect,useMemo,useRef } from "react";
import { AccessibilityInfo, Animated, PanResponder, Platform, View } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
export function ToastView({
  toast,
  controller,
}: {
  toast: ToastItem;
  controller: ReturnType<typeof createFeedbackController>;
}) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(), spec = tokens.extensions.toast;
  const reasons = useRef({ hover: Symbol("hover"), actionHover: Symbol("actionHover"),
    closeHover: Symbol("closeHover"), focus: Symbol("focus"), swipe: Symbol("swipe") }).current;
  useEffect(() => () => {
    for (const reason of Object.values(reasons)) controller.resumeToast(toast.id, reason);
  }, [controller, toast.id, reasons]);
  const { tone, icon, compact, closable, sideAction, role, live, spoken } = toastPresentation(toast);
  // iOS has no live regions, so VoiceOver hears a toast only when it is announced; Android uses the region below.
  useEffect(() => {
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);
  const dismiss = (reason: "close" | "action") => controller.closeToast(toast.id, reason);
  // A sideways swipe past the distance closes the toast; a shorter one springs back and resumes its time.
  const drag = useRef(new Animated.Value(0)).current;
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > toastSwipeDistance() / 8,
    onPanResponderGrant: () => controller.pauseToast(toast.id, reasons.swipe),
    onPanResponderMove: (_, g) => drag.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) >= toastSwipeDistance()) { dismiss("close"); return; }
      Animated.timing(drag, { toValue: 0, duration: tokens.motion.toastMove, useNativeDriver: Platform.OS !== "web" }).start();
      controller.resumeToast(toast.id, reasons.swipe);
    },
    onPanResponderTerminate: () => {
      drag.setValue(0);
      controller.resumeToast(toast.id, reasons.swipe);
    },
  }), [controller, toast.id, reasons, drag]);
  const fade = drag.interpolate({ inputRange: [-2, 0, 2].map((step) => step * toastSwipeDistance()), outputRange: [0, 1, 0] });
  const line = typeStyle("control").lineHeight, target = Math.max(spec.closeSize, tokens.native.minimumTouchTarget);
  // A danger toast colours its heading, or its one line; every other tone keeps colour in the icon.
  const heading = tone === "danger" ? colors.danger : colors.text;
  // Korean wraps between words on iOS, like keep-all on the web.
  const words = { lineBreakStrategyIOS: "hangul-word" as const };
  const action = toast.action && (
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
          dismiss("action");
        }
      }}
      style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center", alignSelf: "flex-start" }}
    >
      <KText style={{ ...typeStyle("control"), color: colors.text, textDecorationLine: "underline" }}>
        {toast.action.label}
      </KText>
    </Pressable>
  );
  return (
    <Pressable
      accessible={false}
      onHoverIn={() => controller.pauseToast(toast.id, reasons.hover)}
      onHoverOut={() => controller.resumeToast(toast.id, reasons.hover)}
      style={compact ? { alignSelf: "center", maxWidth: "100%" } : { width: "100%", maxWidth: spec.maxWidth, alignSelf: "flex-end" }}
    >
      <Animated.View
        {...swipe.panHandlers}
        // Native Web keeps a selector for tests and apps; it is not part of the visual contract.
        {...(Platform.OS === "web" ? { dataSet: { kjunToast: tone } } : {})}
        // React Native's role list has no "status"; Native Web maps it through role.
        accessibilityRole={role === "alert" ? "alert" : "text"}
        {...({ role } as object)}
        accessibilityLiveRegion={live}
        style={{
          transform: [{ translateX: drag }],
          opacity: fade,
          flexDirection: "row",
          alignItems: compact ? "center" : "flex-start",
          gap: compact ? spec.compact.gap : spec.gap,
          ...(compact ? {
            minHeight: spec.compact.height,
            paddingLeft: spec.compact.paddingStart,
            paddingRight: spec.compact.paddingEnd,
            borderRadius: spec.compact.radius,
          } : {
            paddingVertical: spec.paddingY,
            paddingLeft: spec.paddingStart,
            paddingRight: sideAction || closable ? spec.paddingEnd : spec.paddingStart,
            borderRadius: spec.radius,
          }),
          backgroundColor: colors.surface,
          boxShadow: shadowLayers(spec.elevation, colors),
          borderWidth: tokens.border.defaultWidth,
          borderColor: colors.border,
        }}
      >
        <View style={{ height: line, justifyContent: "center" }}>
          <KjunIcon name={icon} size={spec.iconSize} color={colors[`${tone}Accent`]} spin={!!toast.loading} />
        </View>
        <View style={compact ? { flexShrink: 1 } : { flex: 1, minWidth: 0 }}>
          {!!toast.title && (
            <KText {...words} style={{ ...typeStyle("control"), color: heading, marginBottom: spec.titleGap }}>
              {toast.title}
            </KText>
          )}
          <KText {...words} style={toast.title ? { ...typeStyle("body"), color: colors.textSecondary } : { ...typeStyle("label"), color: heading }}>
            {toast.message}
          </KText>
          {!sideAction && action && <View style={{ marginTop: spec.actionGap - (tokens.native.minimumTouchTarget - line) / 2,
            marginBottom: (line - tokens.native.minimumTouchTarget) / 2 }}>{action}</View>}
        </View>
        {(sideAction || closable) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: spec.sideGap, marginVertical: compact ? 0 : (line - target) / 2 }}>
            {sideAction && action}
            {closable && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={m.closeNotification}
                onHoverIn={() => controller.pauseToast(toast.id, reasons.closeHover)}
                onHoverOut={() => controller.resumeToast(toast.id, reasons.closeHover)}
                onFocus={() => controller.pauseToast(toast.id, reasons.focus)}
                onBlur={() => controller.resumeToast(toast.id, reasons.focus)}
                onPress={() => dismiss("close")}
                style={{
                  minWidth: target,
                  minHeight: target,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: spec.closeRadius,
                }}
              >
                <KjunIcon name="x" size={spec.closeIconSize} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}
