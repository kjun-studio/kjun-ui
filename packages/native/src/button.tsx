import { FontText, useReducedMotion } from "./internal";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { typeStyle } from "./typography";
import { TopNavigationContext } from "./top-navigation-context";
import { BottomActionBarContext } from "./bottom-action-bar-context";
import { FormActionsContext } from "./form-actions-context";
import { CardActionsContext } from "./card-actions-context";
import { CardBrandContext } from "./card-surface-context";
import { AlertActionsContext } from "./alert-actions-context";
import { textTint } from "./text-tint";
import { useActionPill, useActionSize } from "../../../shared/package-runtime/action-size";
import { DataStateContentContext } from "./data-state-context";
import { tokens,type ButtonSize,type ButtonVariant } from "@kjun-ui/tokens";
import { useIcon } from "../../../shared/package-runtime/icon-context";
import { useContext,useEffect,useRef,type ReactNode } from "react";
import { useMinimumLoading } from "../../../shared/package-runtime/minimum-loading";
import {
Animated,
Easing,
Platform,
StyleSheet,
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
interface KjunIconProps {
  name: string;
  size?: number;
  color?: ColorValue;
  spin?: boolean;
  filled?: boolean;
  /** Names an icon that carries meaning on its own; screen readers then read it as an image. Without it the icon is decorative and hidden. */
  ariaLabel?: string;
}
export function KjunIcon(props: KjunIconProps) {
  return <IconBase {...props} />;
}
/** Turns its content while mounted, unless the device asks for reduced motion. Only a spinning icon mounts it. */
function Spinning({ size, children }: { size: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const angle = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) return;
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
  }, [reduced, angle]);
  return (
    <Animated.View accessible={false} style={{ width: size, height: size,
      transform: [{ rotate: angle.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }] }}>
      {children}
    </Animated.View>
  );
}
/** Internal: KjunIcon with a stroke width in viewBox units, for parts that paint one fixed line weight. */
export function IconBase({
  name,
  size = tokens.iconSizes.default,
  color,
  spin = false,
  filled = false,
  ariaLabel,
  strokeWidth: stroke,
}: KjunIconProps & { strokeWidth?: number }) {
  const { colors } = useKjunStyles();
  const { nodes, filled: renderFilled } = useIcon(name, filled), strokeWidth = stroke ?? 2;
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
  const svg = (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color || colors.text}
      fill={renderFilled ? color || colors.text : "none"}
      stroke={renderFilled ? "none" : color || colors.text}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {nodes.map(([tag, attrs], i) => {
        const Part = parts[tag];
        return Part ? <Part key={i} {...attrs} /> : null;
      })}
    </Svg>
  );
  const drawn = spin ? <Spinning size={size}>{svg}</Spinning> : svg;
  const box = { width: size, height: size };
  // The drawing never speaks for itself (Native Web would read each SVG as an image). A named icon wraps it as one image.
  return ariaLabel ? (
    <View accessible accessibilityRole="image" accessibilityLabel={ariaLabel} style={box}>
      <View {...hiddenDrawing} style={box}>{drawn}</View>
    </View>
  ) : (
    <View {...hiddenDrawing} style={box}>{drawn}</View>
  );
}
const hiddenDrawing = { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" as const, "aria-hidden": true };
export { useMinimumLoading };
export interface KjunButtonProps
  extends Omit<PressableProps, "children" | "style"> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** "circle" makes an icon-only button round: as wide as its height with a full radius. "pill" rounds a button with a label
   * fully and keeps its width, for a button inside a rounded bar. */
  shape?: "default" | "circle" | "pill";
  loading?: boolean;
  block?: boolean;
  /** Long labels wrap: the size's height becomes a minimum and the button grows instead of overflowing. */
  wrap?: boolean;
  prefixIcon?: string;
  suffixIcon?: string;
  /** A node in the icon's place (a brand logo, a small avatar), fitted to the size's icon box. Wins over prefixIcon. */
  prefix?: ReactNode;
  /** A node in the suffix icon's place, fitted to the size's icon box. Wins over suffixIcon. */
  suffix?: ReactNode;
  prefixIconFilled?: boolean;
  suffixIconFilled?: boolean;
  ariaLabel?: string;
  spinOnLoading?: boolean;
  style?: StyleProp<ViewStyle>;
}
/**
 * Package-internal: a show/hide toggle (a table row or group) reports expanded without the open-menu fill. The web fills
 * only menu and dialog triggers (aria-haspopup), and its disclosure toggles stay flat.
 */
export const disclosureButton = { "data-kjun-disclosure": true } as unknown as Partial<KjunButtonProps>;
export function KjunButton(input: KjunButtonProps) {
  const {
  children,
  variant = "primary",
  shape = "default",
  size: declaredSize = "md",
  loading = false,
  block = false,
  wrap = false,
  disabled = false,
  prefixIcon: prefixName,
  suffixIcon: suffixName,
  prefix,
  suffix,
  prefixIconFilled,
  suffixIconFilled,
  ariaLabel,
  spinOnLoading,
  style,
  onPress,
  ...rest
  } = input;
  const { "data-kjun-disclosure": disclosure, ...props } = rest as typeof rest & { "data-kjun-disclosure"?: boolean };
  const size = useActionSize(input.size, declaredSize), pill = useActionPill(shape);
  const alertActions = useContext(AlertActionsContext);
  const { colors: c, fontFamily } = useKjunStyles();
  const busy = useMinimumLoading(loading);
  const navigation = useContext(TopNavigationContext);
  const compactActionBar = useContext(BottomActionBarContext);
  const formActions = useContext(FormActionsContext);
  const cardActions = useContext(CardActionsContext);
  // On a brand card a primary or link action uses the brand-action roles, so it does not take the card's own colour.
  const brandCard = useContext(CardBrandContext);
  const stateContent = useContext(DataStateContentContext);
  const multiline = wrap || !!formActions || cardActions || !!stateContent;
  const height = Math.max(tokens.button.heights[size], navigation?.controlSize ?? 0);
  const iconSize = navigation?.iconSize ?? tokens.button.iconSizes[size];
  const hasContent =
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== "";
  const prefixNode = prefix != null && prefix !== false, suffixNode = suffix != null && suffix !== false;
  // Either form of a side item takes the icon's place, inset and loading rules.
  const prefixIcon = prefixNode || !!prefixName, suffixIcon = suffixNode || !!suffixName;
  const iconOnly = !hasContent && !!(prefixIcon || suffixIcon || busy);
  const positive = ["primary", "danger", "success", "warning"].includes(
    variant
  );
  const link = variant === "link";
  const ink = link ? brandCard ? c.onBrand : c.brand : variant === "danger-ghost" ? c.danger : variant === "primary" && brandCard ? c.brandActionText : positive
    ? ({ primary: c.onBrand, danger: c.onDanger, success: c.onSuccess, warning: c.onWarning } as Record<string, typeof c.inverse>)[variant]
    : variant === "secondary"
    ? c.text
    : c.textSecondary;
  const base =
    variant === "primary"
      ? brandCard ? c.brandAction : c.brand
      : variant === "secondary"
      ? alertActions ? textTint(c.text, "tintControl", c.surface) : c.buttonSecondary
      : variant === "danger"
      ? c.danger
      : variant === "success"
      ? c.success
      : variant === "warning"
      ? c.warning
      : "transparent";
  const spinPrefix = busy && !prefixNode && !!prefixName && (spinOnLoading ?? prefixName === "refresh");
  const before = prefixIcon && !(busy && !spinPrefix);
  // A node sits in the icon box and is clipped there; disabled dims it, as the web build greys it.
  const media = (node: ReactNode, hidden = false) => <View style={{ width: iconSize, height: iconSize, overflow: "hidden",
    alignItems: "center", justifyContent: "center", opacity: hidden ? 0 : disabled ? tokens.states.opacity.disabled : 1 }}>{node}</View>;
  const overlayLoading = busy && !prefixIcon && !suffixIcon;
  const paint = (pressed: boolean, hovered: boolean) => {
    const expanded = !disclosure && props.accessibilityState?.expanded;
    // Disabled actions share one neutral paint so no variant reads as a paler tone of itself.
    if (disabled) return { background: variant === "ghost" || variant === "danger-ghost" || link ? "transparent" : c.buttonSecondary, ink: c.textDisabled };
    if (link) return { background: "transparent", ink: brandCard ? c.onBrand : pressed ? c.brandActive : c.brand };
    if (busy || (!pressed && !hovered && !expanded)) return { background: base, ink };
    pressed = pressed || !!expanded;
    const background = variant === "primary" ? brandCard ? pressed ? c.brandActionActive : c.brandActionHover : pressed ? c.brandActive : c.brandHover
      : variant === "secondary" && alertActions ? textTint(c.text, pressed ? "tintActive" : "tintHover", pressed ? c.active : c.hover)
      : variant === "secondary" ? pressed ? c.buttonSecondaryActive : c.buttonSecondaryHover
      : variant === "ghost" ? pressed ? c.active : c.hover
      : variant === "danger-ghost" ? c.dangerBg
      : variant === "danger" ? pressed ? c.dangerActive : c.dangerDark
      : variant === "success" ? pressed ? c.successActive : c.successDark
      : pressed ? c.warningActive : c.warningDark;
    return { background, ink: variant === "ghost" ? c.text : variant === "danger-ghost" && pressed ? c.dangerDark : ink };
  };
  // A link button is only as tall as its text line, so its touch area grows to the 44px minimum around it.
  const hit = Math.max(0, (tokens.native.minimumTouchTarget - (link ? tokens.button.typography[size].lineHeightPx : height)) / 2);
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel || props.accessibilityLabel}
      accessibilityState={{ ...props.accessibilityState, disabled: !!disabled || busy, busy }}
      // A loading button stays focusable and refuses presses itself; screen readers still hear it as unavailable and busy.
      disabled={!!disabled}
      hitSlop={{ top: hit, bottom: hit, left: hit, right: hit }}
      onPress={(event) => {
        if (!disabled && !busy) onPress?.(event);
      }}
      style={({ pressed, hovered }: any) => [
        {
          height,
          minHeight: height,
          width: block ? "100%" : iconOnly || shape === "circle" ? height : undefined,
          alignSelf: block ? "stretch" : "flex-start",
          flexGrow: compactActionBar === "fill" ? (hasContent ? 1 : undefined) : compactActionBar && positive && hasContent ? 1 : undefined,
          ...(compactActionBar === "fill" && hasContent ? { flexBasis: 0, minWidth: 0 } : {}),
          // A width set by the caller (fixed square controls) wins over the label minimum.
          minWidth: hasContent && !block && StyleSheet.flatten(style)?.width == null ? tokens.button.minWidths[size] : undefined,
          paddingHorizontal: iconOnly ? 0 : tokens.button.paddingX[size],
          // Icon glyphs carry their own side bearing, so the icon side takes a tighter inset.
          ...(!iconOnly && prefixIcon ? { paddingLeft: tokens.button.iconSidePaddingX[size] } : {}),
          ...(!iconOnly && suffixIcon ? { paddingRight: tokens.button.iconSidePaddingX[size] } : {}),
          borderRadius: pill ? tokens.shape.pill : tokens.button.radii[size],
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: hasContent ? tokens.button.contentGaps[size] : 0,
          // In the top bar a text action shortens to an ellipsis instead of wrapping; icon-only ones keep their square.
          ...(navigation ? { maxWidth: '100%' as const, flexShrink: hasContent ? 1 : 0 } : {}),
          backgroundColor: paint(pressed, hovered && Platform.OS === "web").background,
          ...(Platform.OS === "web" ? {
            outlineStyle: "solid" as const,
            // AccessiblePressable draws the ring for keyboard focus; Pressable's own focused state is also true after a click.
            outlineColor: c.focusRing, outlineWidth: 0, outlineOffset: tokens.states.focus.offset,
          } : {}),
          transform: [{ scale: pressed && !disabled && !busy ? tokens.states.scale.pressed : 1 }],
          ...(multiline ? {
            height: 'auto' as const, maxWidth: '100%' as const,
            paddingVertical: Math.max(0, (height - Math.max(tokens.button.typography[size].lineHeightPx,
              navigation && (prefixIcon || suffixIcon || !hasContent) ? iconSize : 0)) / 2),
            ...(formActions?.stacked ? { width: '100%' as const, alignSelf: 'stretch' as const } : {}),
          } : {}),
          // Bare ghost actions read only by their ink, so disabled ones also take the disabled opacity, as on the web.
          ...(disabled && (variant === "ghost" || variant === "danger-ghost") ? { opacity: tokens.states.opacity.disabled } : {}),
          ...(link ? { height: undefined, minHeight: 0, minWidth: undefined, width: undefined, paddingHorizontal: 0, paddingLeft: 0, paddingRight: 0, borderRadius: 0 } : {}),
        },
        style,
      ]}
    >
      {({ pressed, hovered }: any) => {
        const color = paint(pressed, hovered && Platform.OS === "web").ink;
        return <>
          {busy && !!prefixIcon && !spinPrefix && <KjunSpinnerGlyph size={iconSize} color={color} />}
          {before && (prefixNode ? media(prefix) : <KjunIcon name={prefixName!} filled={!busy && prefixIconFilled}
            size={iconSize} color={color} spin={busy} />)}
          {hasContent && <FontText numberOfLines={navigation?.slot ? 1 : undefined} ellipsizeMode="tail" style={{ fontFamily,
            ...typeStyle(tokens.button.typography[size]),
            color, opacity: overlayLoading ? 0 : 1,
            // A link is underlined at rest, like KjunExternalLink, so it reads as one in body text of the same colour.
            ...(link ? { textDecorationLine: 'underline' as const } : {}),
            ...(multiline || navigation ? { flexShrink: 1, minWidth: 0, textAlign: 'center' as const } : {}),
          }}>{children}</FontText>}
          {!!suffixIcon && <View style={{ opacity: busy && prefixIcon ? 0 : 1 }}>
            {busy && !prefixIcon ? <KjunSpinnerGlyph size={iconSize} color={color} /> : suffixNode ? media(suffix) : <KjunIcon name={suffixName!}
              filled={!busy && suffixIconFilled} size={iconSize} color={color} />}
          </View>}
          {overlayLoading && <View pointerEvents="none" accessible={false} style={{
            position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
            alignItems: "center", justifyContent: "center",
          }}><KjunSpinnerGlyph size={iconSize} color={color} /></View>}
        </>;
      }}
    </Pressable>
  );
}
