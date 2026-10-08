import { typeStyle } from "./typography";
import { TopNavigationContext } from "./top-navigation-context";
import { BottomActionBarContext } from "./bottom-action-bar-context";
import { FormActionsContext } from "./form-actions-context";
import { CardActionsContext } from "./card-actions-context";
import { AlertActionsContext } from "./alert-actions-context";
import { useActionSize } from "../../../shared/package-runtime/action-size";
import { DataStateContentContext } from "./data-state-context";
import { tokens,type ButtonSize,type ButtonVariant } from "@kjun-ui/tokens";
import { useIcon } from "../../../shared/package-runtime/icon-context";
import { useContext,useEffect,useRef,useState,type ReactNode } from "react";
import {
AccessibilityInfo,
Animated,
Easing,
Platform,
StyleSheet,
Text,
View,
type ColorValue,
type PressableProps,
type StyleProp,
type ViewStyle
} from "react-native";
import Svg,{
Circle,
Ellipse,
G,
Line,
Path,
Polygon,
Polyline,
Rect,
} from "react-native-svg";
import { AccessiblePressable as Pressable } from "./a11y";
import { useKjunStyles } from "./provider";
export function DsIcon({
  name,
  size = tokens.iconSizes.default,
  color,
  spin = false,
  filled = false,
}: {
  name: string;
  size?: number;
  color?: ColorValue;
  spin?: boolean;
  filled?: boolean;
}) {
  const { colors } = useKjunStyles();
  const { nodes, filled: renderFilled } = useIcon(name, filled);
  const angle = useRef(new Animated.Value(0)).current;
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (!spin || reduced) return;
    const loop = Animated.loop(
      Animated.timing(angle, {
        toValue: 1,
        duration: tokens.motion.spin,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      })
    );
    loop.start();
    return () => {
      loop.stop();
      angle.setValue(0);
    };
  }, [spin, reduced, angle]);
  const parts: Record<string, React.ComponentType<any>> = {
    path: Path,
    circle: Circle,
    line: Line,
    polyline: Polyline,
    polygon: Polygon,
    rect: Rect,
    ellipse: Ellipse,
    g: G,
  };
  return (
    <Animated.View
      accessible={false}
      style={{
        width: size,
        height: size,
        transform: [
          {
            rotate: angle.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "360deg"],
            }),
          },
        ],
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        color={color || colors.text}
        fill={renderFilled ? color || colors.text : "none"}
        stroke={renderFilled ? "none" : color || colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {nodes.map(([tag, attrs], i) => {
          const Part = parts[tag];
          return Part ? <Part key={i} {...attrs} /> : null;
        })}
      </Svg>
    </Animated.View>
  );
}
function useMinimumLoading(loading: boolean) {
  const [active, setActive] = useState(loading);
  const began = useRef(loading ? Date.now() : 0);
  useEffect(() => {
    if (loading) {
      began.current = Date.now();
      setActive(true);
      return;
    }
    const timer = setTimeout(
      () => setActive(false),
      Math.max(0, tokens.button.loadingMinimum - (Date.now() - began.current))
    );
    return () => clearTimeout(timer);
  }, [loading]);
  return loading || active;
}
export interface DsButtonProps
  extends Omit<PressableProps, "children" | "style"> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  block?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  prefixIconFilled?: boolean;
  suffixIconFilled?: boolean;
  ariaLabel?: string;
  spinOnLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}
export function DsButton(input: DsButtonProps) {
  const {
  children,
  variant = "primary",
  size: declaredSize = "md",
  loading = false,
  block = false,
  disabled = false,
  prefixIcon,
  suffixIcon,
  prefixIconFilled,
  suffixIconFilled,
  ariaLabel,
  spinOnLoading,
  style,
  onPress,
  ...props
  } = input;
  const size = useActionSize(input.size, declaredSize);
  const alertActions = useContext(AlertActionsContext);
  const { colors: c, fontFamily } = useKjunStyles();
  const busy = useMinimumLoading(loading);
  const navigation = useContext(TopNavigationContext);
  const compactActionBar = useContext(BottomActionBarContext);
  const formActions = useContext(FormActionsContext);
  const cardActions = useContext(CardActionsContext);
  const stateContent = useContext(DataStateContentContext);
  const multiline = !!formActions || cardActions || !!stateContent || navigation?.slot === 'actions';
  const height = Math.max(tokens.button.heights[size], navigation?.controlSize ?? 0);
  const iconSize = navigation?.iconSize ?? tokens.button.iconSizes[size];
  const hasContent =
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== "";
  const iconOnly = !hasContent && !!(prefixIcon || suffixIcon || busy);
  const positive = ["primary", "danger", "success", "warning"].includes(
    variant
  );
  const ink = variant === "danger-ghost" ? c.danger : positive
    ? ({ primary: c.onBrand, danger: c.onDanger, success: c.onSuccess, warning: c.onWarning } as Record<string, typeof c.inverse>)[variant]
    : variant === "secondary"
    ? c.text
    : c.textSecondary;
  const base =
    variant === "primary"
      ? c.brand
      : variant === "secondary"
      ? alertActions ? c.surface : c.buttonSecondary
      : variant === "danger"
      ? c.danger
      : variant === "success"
      ? c.success
      : variant === "warning"
      ? c.warning
      : "transparent";
  const before = prefixIcon && (busy
    ? (spinOnLoading ?? prefixIcon === "refresh") ? prefixIcon : "loader-2"
    : prefixIcon);
  const overlayLoading = busy && !prefixIcon && !suffixIcon;
  const paint = (pressed: boolean, hovered: boolean) => {
    const expanded = props.accessibilityState?.expanded;
    // Disabled actions share one neutral paint so no variant reads as a paler tone of itself.
    if (disabled) return { background: variant === "ghost" || variant === "danger-ghost" ? "transparent" : c.buttonSecondary, ink: c.textDisabled };
    if (busy || (!pressed && !hovered && !expanded)) return { background: base, ink };
    pressed = pressed || !!expanded;
    const background = variant === "primary" ? pressed ? c.brandActive : c.brandHover
      : variant === "secondary" && !alertActions ? pressed ? c.buttonSecondaryActive : c.buttonSecondaryHover
      : variant === "secondary" || variant === "ghost" ? pressed ? c.active : c.hover
      : variant === "danger-ghost" ? c.dangerBg
      : variant === "danger" ? pressed ? c.dangerActive : c.dangerDark
      : variant === "success" ? pressed ? c.successActive : c.successDark
      : pressed ? c.warningActive : c.warningDark;
    return { background, ink: variant === "ghost" ? c.text : variant === "danger-ghost" && pressed ? c.dangerDark : ink };
  };
  const hit = Math.max(0, (tokens.native.minimumTouchTarget - height) / 2);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel || props.accessibilityLabel}
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled || busy, busy }}
      disabled={disabled || busy}
      hitSlop={{ top: hit, bottom: hit, left: hit, right: hit }}
      onPress={(event) => {
        event.stopPropagation();
        if (!disabled && !busy) onPress?.(event);
      }}
      style={({ pressed, hovered }: any) => [
        {
          height,
          minHeight: height,
          width: block ? "100%" : iconOnly ? height : undefined,
          alignSelf: block ? "stretch" : "flex-start",
          flexGrow: compactActionBar && positive && hasContent ? 1 : undefined,
          // A width set by the caller (fixed square controls) wins over the label minimum.
          minWidth: hasContent && !block && StyleSheet.flatten(style)?.width == null ? tokens.button.minWidths[size] : undefined,
          paddingHorizontal: iconOnly ? 0 : tokens.button.paddingX[size],
          // Icon glyphs carry their own side bearing, so the icon side takes a tighter inset.
          ...(!iconOnly && prefixIcon ? { paddingLeft: tokens.button.iconSidePaddingX[size] } : {}),
          ...(!iconOnly && suffixIcon ? { paddingRight: tokens.button.iconSidePaddingX[size] } : {}),
          borderRadius: tokens.button.radii[size],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: hasContent ? tokens.button.contentGaps[size] : 0,
          ...(navigation ? { maxWidth: '100%' as const } : {}),
          backgroundColor: paint(pressed, hovered && Platform.OS === "web").background,
          ...(Platform.OS === "web" ? {
            outlineStyle: "solid" as const,
            // AccessiblePressable draws the ring for keyboard focus; Pressable's own focused state is also true after a click.
            outlineColor: c.focusRing, outlineWidth: 0, outlineOffset: tokens.states.focus.offset,
          } : {}),
          transform: [{ scale: pressed && !disabled && !busy ? 0.98 : 1 }],
          ...(multiline ? {
            height: 'auto' as const, maxWidth: '100%' as const,
            paddingVertical: Math.max(0, (height - Math.max(tokens.button.typography[size].lineHeightPx,
              navigation && (prefixIcon || suffixIcon || !hasContent) ? iconSize : 0)) / 2),
            ...(formActions?.stacked ? { width: '100%' as const, alignSelf: 'stretch' as const } : {}),
          } : {}),
        },
        style,
      ]}
    >
      {({ pressed, hovered }: any) => {
        const color = paint(pressed, hovered && Platform.OS === "web").ink;
        return <>
          {before && <DsIcon name={before} filled={!busy && prefixIconFilled}
            size={iconSize} color={color} spin={busy} />}
          {hasContent && <Text numberOfLines={navigation?.slot === 'leading' ? 1 : undefined} ellipsizeMode="tail" style={{ fontFamily,
            ...typeStyle(tokens.button.typography[size]),
            color, opacity: overlayLoading ? 0 : 1,
            ...(multiline || navigation ? { flexShrink: 1, minWidth: 0, textAlign: 'center' as const } : {}),
          }}>{children}</Text>}
          {suffixIcon && <View style={{ opacity: busy && prefixIcon ? 0 : 1 }}>
            <DsIcon name={busy && !prefixIcon ? "loader-2" : suffixIcon}
              filled={!busy && suffixIconFilled} spin={busy && !prefixIcon}
              size={iconSize} color={color} />
          </View>}
          {overlayLoading && <View pointerEvents="none" accessible={false} style={{
            position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
            alignItems: "center", justifyContent: "center",
          }}><DsIcon name="loader-2" spin size={iconSize} color={color} /></View>}
        </>;
      }}
    </Pressable>
  );
}
