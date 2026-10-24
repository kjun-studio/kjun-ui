import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { typeStyle } from "./typography";
import { tokens } from "@kjun-ui/tokens";
import { useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { DataStateContentContext } from "./data-state-context";
import {
Animated,
Easing,
Platform,
StyleSheet,
View,
type StyleProp,
type ViewStyle
} from "react-native";
import Svg,{ Circle,Path } from "react-native-svg";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunIcon } from "./button";
import { AlertActionsContext } from "./alert-actions-context";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
import { KText,content,domainColor,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { progressCircle } from "../../../shared/package-runtime/progress-circle";

export type DisplaySize = "xs" | "sm" | "md" | "lg" | "xl";
export type SemanticTone =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
export interface KjunBadgeProps {
  variant?: "default" | "secondary" | SemanticTone | "price-up" | "price-down";
  size?: DisplaySize;
  dot?: boolean;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}
const badgeLayoutKeys = new Set(["alignSelf", "flex", "flexGrow", "flexShrink", "flexBasis", "position", "top", "right", "bottom", "left", "start", "end", "zIndex",
  "margin", "marginTop", "marginRight", "marginBottom", "marginLeft", "marginHorizontal", "marginVertical", "marginStart", "marginEnd"]);
/** Badge placement (alignSelf, margins, flex, position) belongs to the outer row; paint stays on the pill. */
function splitBadgeStyle(style: StyleProp<ViewStyle>) {
  const outer: Record<string, unknown> = {}, inner: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(StyleSheet.flatten(style) || {})) (badgeLayoutKeys.has(key) ? outer : inner)[key] = value;
  return { outer: outer as ViewStyle, inner: inner as ViewStyle };
}
export function KjunBadge(props: KjunBadgeProps) {
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
}: KjunBadgeProps & { dotSize?: number }) {
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
  // The transparent row keeps the pill at its own width in a stretching column and at the top of a
  // stretching row, yet follows a row's alignItems (a pill with alignSelf: flex-start sat at the top of
  // centred rows). Layout keys from style place this row; the rest paints the pill.
  const { outer, inner } = splitBadgeStyle(style);
  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-start", maxWidth: "100%", minWidth: 0, flexShrink: 1 }, outer]}>
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          maxWidth: "100%",
          minWidth: 0,
          flexShrink: 1,
          gap: tokens.extensions.badge.gap,
          paddingHorizontal: x,
          paddingVertical: y,
          borderRadius: tokens.extensions.badge.radius,
          backgroundColor: background,
        },
        inner,
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
    </View>
  );
}
export interface KjunEmptyProps {
  text?: string;
  description?: string;
  icon?: string;
  children?: ReactNode;
}
export function KjunEmpty({
  text,
  description,
  icon,
  children,
}: KjunEmptyProps) {
  const m = useKjunMessages();
  text ??= m.noData;
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
      {!!icon && (
        <View style={{ marginBottom: spec.iconGap }}>
          <KjunIcon name={icon} size={spec.iconSize} color={colors.textSecondary} />
        </View>
      )}
      <KText style={{ ...typeStyle('cardTitle'), color: colors.text, fontSize: spec.titleSize, lineHeight: spec.titleLineHeight, textAlign: "center", maxWidth: spec.textMaxWidth }}>
        {text}
      </KText>
      {!!description && (
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
      {hasContent(children) && <View style={{ marginTop: spec.actionGap, maxWidth: '100%' }}>{content(children)}</View>}
    </View>
  );
}
export interface KjunSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function KjunSpinner({ size = "md", text }: KjunSpinnerProps) {
  const m = useKjunMessages();
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
      accessibilityLabel={text || m.loading}
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
      {!!text && (
        <KText style={{ marginLeft: tokens.dimension.value8, color: colors.textSecondary }}>
          {text}
        </KText>
      )}
    </View>
  );
}
export interface KjunAlertProps {
  type?: "info" | "success" | "warning" | "danger" | "error";
  variant?: SemanticTone;
  size?: "sm" | "md" | "lg";
  title?: ReactNode;
  closable?: boolean;
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live?: AlertLive;
  children?: ReactNode;
  /** Buttons placed under the message; unsized KjunButtons follow the alert size. */
  actions?: ReactNode;
  onClose?: () => void;
}
export function KjunAlert({
  type = "info",
  variant,
  size = "md",
  title,
  closable = false,
  live,
  children,
  actions,
  onClose,
}: KjunAlertProps) {
  const m = useKjunMessages();
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
      role={alertRole(tone, live)}
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
      <KjunIcon
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
                {content(actions)}
              </View>
            </AlertActionsContext.Provider>
          </ActionSizeContext.Provider>
        )}
      </View>
      {closable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={m.close}
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
          {({ pressed, hovered }: any) => <KjunIcon name="x" size={geometry.closeIconSize}
            color={pressed || hovered ? colors.text : colors.textTertiary} />}
        </Pressable>
      )}
    </View>
  );
}
export interface KjunProgressProps {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: SemanticTone;
  showLabel?: boolean;
  label?: ReactNode;
  subLabel?: ReactNode;
  shape?: "bar" | "circle";
}
export function KjunProgress({
  value = 0,
  max = 100,
  size = "md",
  variant = "primary",
  showLabel = false,
  label,
  subLabel,
  shape = "bar",
}: KjunProgressProps) {
  const m = useKjunMessages();
  const { colors, numericFontFamily, fontFamily } = useKjunStyles();
  const percentage =
    Number.isFinite(value) && max > 0
      ? Math.min(100, Math.max(0, Math.round((value / max) * 100)))
      : 0;
  const name = typeof label === "string" ? label : m.progress, color = variant === "primary" ? colors.brand : colors[variant];
  // RN Web drops accessibilityValue, so the value also goes out as aria-value* props.
  const semantics = { accessibilityRole: "progressbar" as const, accessibilityLabel: name, accessibilityValue: { min: 0, max: 100, now: percentage },
    "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percentage };
  if (shape === "circle") {
    // Like Web: circle, then label and subLabel centred below it.
    const c = progressCircle(size, percentage);
    return (
      <View style={{ alignSelf: "flex-start", alignItems: "center" }}>
        <View {...semantics} style={{ width: c.diameter, height: c.diameter, alignItems: "center", justifyContent: "center" }}>
          <Svg width={c.diameter} height={c.diameter} viewBox={`0 0 ${c.diameter} ${c.diameter}`} style={StyleSheet.absoluteFill}>
            <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={colors.secondary} strokeWidth={c.stroke} fill="none" />
            {percentage > 0 && <Circle cx={c.centre} cy={c.centre} r={c.radius} stroke={color} strokeWidth={c.stroke} fill="none"
              strokeLinecap="round" strokeDasharray={c.circumference} strokeDashoffset={c.offset} rotation={-90} origin={`${c.centre}, ${c.centre}`} />}
          </Svg>
          {showLabel && c.showsPercentage && <KText style={{ ...typeStyle(size === "lg" ? "numberMd" : "meta"), fontFamily: numericFontFamily || fontFamily,
            fontVariant: ["tabular-nums"], color: colors.text }}>{percentage}%</KText>}
        </View>
        {content(label, { ...typeStyle("caption"), marginTop: tokens.dimension.value8, color: colors.textSecondary, textAlign: "center" })}
        {content(subLabel, { ...typeStyle("caption"), marginTop: tokens.dimension.value4, color: colors.textTertiary, textAlign: "center" })}
      </View>
    );
  }
  return (
    <View>
      {!!(label || showLabel) && (
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
        {...semantics}
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
            backgroundColor: color,
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
