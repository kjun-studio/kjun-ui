import { hasContent } from "../../../shared/package-runtime/content-presence";
import { typeStyle } from "./typography";
import { tokens } from "@kjun/tokens";
import { useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { DataStateContentContext } from "./data-state-context";
import {
Animated,
Easing,
Platform,
View,
type StyleProp,
type ViewStyle
} from "react-native";
import Svg,{ Circle,Path } from "react-native-svg";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsIcon } from "./button";
import { AlertActionsContext } from "./alert-actions-context";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
import { KText,content,domainColor,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";

export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export interface DsBadgeProps {
  variant?: "default" | "secondary" | SemanticTone | "price-up" | "price-down";
  size?: DisplaySize;
  dot?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}
export function DsBadge(props: DsBadgeProps) {
  return <BadgeView {...props} />;
}
/** Internal composition keeps KPI dots on their own shared geometry role. */
export function BadgeView({
  variant = "default",
  size = "sm",
  dot = false,
  children,
  style,
  dotSize = tokens.extensions.badge.dotSize,
}: DsBadgeProps & { dotSize?: number }) {
  const { colors, domainColors } = useKjunStyles();
  const { x, y } = tokens.extensions.badge.padding[size];
  const type = typeStyle(size === "xl" ? "controlLarge" : size === "lg" ? "control" : "controlSmall");
  const neutral = variant === "default" || variant === "secondary";
  const financial = variant.startsWith("price-");
  const key = variant === "price-up" ? "priceUp" : "priceDown";
  const background = financial
    ? domainColor(domainColors, key + "Bg")
    : neutral
    ? colors.secondary
    : variant === "primary"
    ? colors.brandSubtleBg
    : colors[(variant + "Bg") as keyof typeof colors];
  const color = financial
    ? domainColor(domainColors, key)
    : neutral
    ? colors.textSecondary
    : variant === "primary"
    ? colors.brandHover
    : colors[variant as keyof typeof colors];
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          maxWidth: "100%",
          minWidth: 0,
          flexShrink: 1,
          gap: tokens.extensions.badge.gap,
          paddingHorizontal: x,
          paddingVertical: y,
          borderRadius: tokens.extensions.badge.radius,
          backgroundColor: background,
        },
        style,
      ]}
    >
      {dot && (
        <View
          // Like Web: the dot centres on the first line, so a wrapped label still starts beside it.
          style={{
            alignSelf: "flex-start",
            marginTop: (type.lineHeight - dotSize) / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          }}
        />
      )}
      {content(children, {
        flexShrink: 1,
        minWidth: 0,
        color,
        ...type,
      })}
    </View>
  );
}
export interface DsEmptyProps {
  text?: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
}
export function DsEmpty({
  text = "데이터가 없습니다",
  description,
  icon,
  children,
}: DsEmptyProps) {
  const { colors } = useKjunStyles();
  const spec = tokens.extensions.empty;
  const stateContent = useContext(DataStateContentContext);
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: stateContent === 'empty' ? 0 : tokens.dimension.value32,
      }}
    >
      {icon && (
        <View style={{ marginBottom: spec.iconGap }}>
          <DsIcon name={icon} size={spec.iconSize} color={colors.textSecondary} />
        </View>
      )}
      <KText style={{ ...typeStyle('cardTitle'), color: colors.text, fontSize: spec.titleSize, lineHeight: spec.titleLineHeight, textAlign: "center", maxWidth: spec.textMaxWidth }}>
        {text}
      </KText>
      {description && (
        <KText
          style={{
            ...typeStyle('caption'),
            fontSize: spec.descriptionSize,
            lineHeight: spec.descriptionLineHeight,
            color: colors.textSecondary,
            marginTop: spec.descriptionGap,
            textAlign: "center",
            maxWidth: spec.textMaxWidth,
          }}
        >
          {description}
        </KText>
      )}
      {children && <View style={{ marginTop: spec.actionGap, maxWidth: '100%' }}>{content(children)}</View>}
    </View>
  );
}
export interface DsSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function DsSpinner({ size = "md", text }: DsSpinnerProps) {
  const { colors } = useKjunStyles(),
    reduced = useReducedMotion(),
    rotation = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: tokens.motion.spin,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    loop.start();
    return () => {
      loop.stop();
      rotation.setValue(0);
    };
  }, [reduced, rotation]);
  const dimension = tokens.extensions.spinner.sizes[size];
  // The stroke keeps a size-specific pixel weight instead of scaling with the 24-unit viewBox.
  const stroke = (tokens.extensions.spinner.strokeWidths[size] * 24) / dimension;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={text || "로딩 중"}
      style={{ flexDirection: "row", alignItems: "center" }}
    >
      <Animated.View
        style={{
          transform: [
            {
              rotate: rotation.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <Svg
          width={dimension}
          height={dimension}
          viewBox="0 0 24 24"
          fill="none"
        >
          <Circle
            cx={12}
            cy={12}
            r={10}
            stroke={colors.brand}
            strokeWidth={stroke}
            opacity={0.25}
          />
          <Path
            d="M22 12A10 10 0 0 0 12 2"
            stroke={colors.brand}
            strokeWidth={stroke}
          />
        </Svg>
      </Animated.View>
      {text && (
        <KText style={{ marginLeft: tokens.dimension.value8, color: colors.textSecondary }}>
          {text}
        </KText>
      )}
    </View>
  );
}
export interface DsAlertProps {
  type?: "info" | "success" | "warning" | "danger" | "error";
  variant?: SemanticTone;
  size?: "sm" | "md" | "lg";
  title?: ReactNode;
  closable?: boolean;
  children?: ReactNode;
  /** Buttons placed under the message; unsized DsButtons follow the alert size. */
  actions?: ReactNode;
  onClose?: () => void;
}
export function DsAlert({
  type = "info",
  variant,
  size = "md",
  title,
  closable = false,
  children,
  actions,
  onClose,
}: DsAlertProps) {
  const { colors } = useKjunStyles();
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  const tone = variant || (type === "error" ? "danger" : type),
    small = size === "sm";
  const geometry = tokens.extensions.alert;
  const lineHeight = tokens.typography[small ? "controlSmall" : "control"].lineHeightPx;
  const titled = hasContent(title);
  const closeSize = small ? geometry.sm.closeSize : geometry.closeSize;
  const pick = (suffix: string) => tone === "primary"
    ? suffix === "Bg" ? colors.brandSubtleBg : suffix === "Light" ? colors.brandLight : colors.brand
    : colors[(tone + suffix) as keyof typeof colors];
  return (
    <View
      role={tone === "danger" ? "alert" : "status"}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: tokens.extensions.alert[small ? "sm" : "md"].gap,
        borderWidth: tokens.border.defaultWidth,
        borderRadius: tokens.extensions.alert.radius,
        paddingVertical: tokens.extensions.alert[small ? "sm" : "md"].paddingY,
        paddingHorizontal: tokens.extensions.alert[small ? "sm" : "md"].paddingX,
        backgroundColor: pick("Bg"),
        borderColor: pick("Light"),
      }}
    >
      <View style={{ height: lineHeight, justifyContent: "center", flexShrink: 0 }}>
      <DsIcon
        name={
          {
            info: "info-circle",
            primary: "info-circle",
            success: "circle-check",
            warning: "alert-triangle",
            danger: "alert-circle",
          }[tone]
        }
        size={tokens.extensions.alert.iconSizes[small ? "sm" : "md"]}
        color={pick("Accent")}
      />
      </View>
      <View style={{ flex: 1, minWidth: 0, minHeight: lineHeight }}>
        {titled && content(title, typeStyle(small ? "controlSmall" : "control"))}
        {hasContent(children) && <View style={{ marginTop: titled ? geometry.descriptionGap : 0 }}>
          {content(children, {
            ...typeStyle(small ? "caption" : "body"),
            color: colors.textSecondary,
          })}
        </View>}
        {hasContent(actions) && (
          <ActionSizeContext.Provider value={alertActionSizes[small ? "sm" : "md"]}>
            <AlertActionsContext.Provider value={true}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: geometry.actionsGap, marginTop: geometry[small ? "sm" : "md"].actionGap }}>
                {actions}
              </View>
            </AlertActionsContext.Provider>
          </ActionSizeContext.Provider>
        )}
      </View>
      {closable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          hitSlop={Math.max(0, (tokens.native.minimumTouchTarget - closeSize) / 2)}
          style={({ pressed, hovered }: any) => ({
            width: closeSize, height: closeSize, flexShrink: 0,
            alignItems: "center", justifyContent: "center", borderRadius: geometry.closeRadius,
            // Center on the first line and pull the glyph onto the padding edge.
            marginVertical: (lineHeight - closeSize) / 2,
            marginEnd: (geometry.closeIconSize - closeSize) / 2,
            backgroundColor: pressed ? colors.active : hovered ? colors.hover : "transparent",
          })}
          onPress={() => {
            setVisible(false);
            onClose?.();
          }}
        >
          {({ pressed, hovered }: any) => <DsIcon name="x" size={geometry.closeIconSize}
            color={pressed || hovered ? colors.text : colors.textTertiary} />}
        </Pressable>
      )}
    </View>
  );
}
export interface DsProgressProps {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: SemanticTone;
  showLabel?: boolean;
  label?: ReactNode;
  subLabel?: ReactNode;
}
export function DsProgress({
  value = 0,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  subLabel,
}: DsProgressProps) {
  const { colors } = useKjunStyles();
  const percentage =
    Number.isFinite(value) && max > 0
      ? Math.min(100, Math.max(0, Math.round((value / max) * 100)))
      : 0;
  return (
    <View>
      {(label || showLabel) && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: tokens.dimension.value8,
          }}
        >
          {content(label, {
            ...typeStyle('caption'),

            color: colors.textSecondary,
          })}
          {showLabel && (
            <KText
              style={{
                ...typeStyle('caption'),

                color: colors.textSecondary,
              }}
            >
              {percentage}%
            </KText>
          )}
        </View>
      )}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={typeof label === "string" ? label : "진행률"}
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
        style={{
          height: tokens.extensions.progress.heights[size],
          backgroundColor: colors.secondary,
          borderRadius: tokens.radius.radius9999,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: `${percentage}%`,
            height: "100%",
            borderRadius: tokens.radius.radius9999,
            backgroundColor:
              variant === "primary" ? colors.brand : colors[variant],
          }}
        />
      </View>
      {content(subLabel, {
        ...typeStyle('caption'),

        marginTop: tokens.dimension.value4,
        color: colors.textTertiary,
      })}
    </View>
  );
}
