import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { badgeCount } from "../../../shared/package-runtime/navigation-badge";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { alertLiveRegion, alertRole, type AlertLive } from "../../../shared/package-runtime/alert-live";
import { alertIcons, alertToneRoles } from "../../../shared/package-runtime/alert-tone";
import { keepFocusPastAlert } from "../../../shared/package-runtime/alert-exit";
import { typeStyle } from "./typography";
import { tokens, type TypographyRole } from "@kjun-ui/tokens";
import { badgeGeometry, badgeToneRoles, type BadgeToneRoles } from "../../../shared/package-runtime/badge-tone";
import { createContext,useContext,useEffect,useRef,useState,type ReactElement,type ReactNode } from "react";
import { DataStateContentContext } from "./data-state-context";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { spinnerStacked } from "../../../shared/package-runtime/spinner-geometry";
import { emptyGeometry, emptyPaddingY, type EmptySize } from "../../../shared/package-runtime/empty-geometry";
import {
Animated,
Easing,
LayoutAnimation,
Platform,
StyleSheet,
View,
useWindowDimensions,
type StyleProp,
type TextStyle,
type ViewStyle
} from "react-native";
import Svg,{ Circle,Path } from "react-native-svg";
import { AccessiblePressable as Pressable } from "./a11y";
import { IconBase, KjunIcon } from "./button";
import { FormActionsContext } from "./form-actions-context";
import { CardTintContext } from "./card-surface-context";
import { AlertActionsContext } from "./alert-actions-context";
import { textTint } from "./text-tint";
import { ActionSizeContext, alertActionSizes } from "../../../shared/package-runtime/action-size";
import { KText,content,domainColor,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { motionOut, nativeDriver } from "./motion";

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
  /** Shows this number instead of children; over max it shows "99+", and 0 or less draws no badge at all. */
  count?: number;
  /** The largest count shown in full (default 99). */
  max?: number;
  /** What the badge means to a screen reader, e.g. "읽지 않은 알림 3개". Give it to a dot-only badge. */
  label?: string;
  /** A screen reader name that replaces the drawn text; label is the shorter way to set it. */
  accessibilityLabel?: string;
  testID?: string;
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
  count,
  max,
  label,
  accessibilityLabel,
  testID,
  children,
  style,
  dotSize,
  paint = badgeToneRoles(variant),
  typeRole,
}: KjunBadgeProps & { dotSize?: number; paint?: BadgeToneRoles; typeRole?: TypographyRole }) {
  const counted = count === undefined ? undefined : badgeCount(count, max);
  const { colors, domainColors } = useKjunStyles();
  const geometry = badgeGeometry(size);
  const { x, y } = geometry.padding;
  const type = typeStyle(typeRole ?? geometry.type);
  const body = counted ?? children, dotOnly = dot && !hasContent(body);
  // Like Web: a dot with no text is the dot alone, at the navigation dot size.
  dotSize ??= dotOnly ? geometry.standaloneDotSize : geometry.dotSize;
  // Price roles are domain colors; every other role is a KjunColors key (kebab role → camelCase key).
  const pick = (name: string) => name.startsWith("price-")
    ? domainColor(domainColors, name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()))
    : colors[name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as keyof typeof colors];
  const tinted = useContext(CardTintContext);
  const background = dotOnly ? "transparent" : tinted ? colors.surface : pick(paint.bg), color = pick(paint.text), dotColor = pick(paint.dot);
  // The transparent row keeps the pill at its own width in a stretching column and at the top of a
  // stretching row, yet follows a row's alignItems (a pill with alignSelf: flex-start sat at the top of
  // centred rows). Layout keys from style place this row; the rest paints the pill.
  const { outer, inner } = splitBadgeStyle(style);
  if (counted === null) return null;
  const name = accessibilityLabel ?? label;
  return (
    <View testID={testID} accessible={!!name} accessibilityLabel={name}
      style={[{ flexDirection: "row", alignItems: "flex-start", maxWidth: "100%", minWidth: 0, flexShrink: 1 }, outer]}>
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          maxWidth: "100%",
          minWidth: 0,
          flexShrink: 1,
          gap: geometry.gap,
          paddingHorizontal: dotOnly ? 0 : counted ? geometry.count.paddingX : x,
          paddingVertical: dotOnly ? 0 : y,
          borderRadius: counted ? geometry.count.radius : geometry.radius,
          // Like the navigation count badges: one digit draws a circle.
          ...(counted ? { minWidth: geometry.count.minWidth, justifyContent: "center" as const } : null),
          backgroundColor: background,
        },
        inner,
      ]}
    >
      {dot && (
        <View
          // Like Web: the dot centres on the first line, so a wrapped label still starts beside it.
          style={{
            alignSelf: dotOnly ? "center" : "flex-start",
            marginTop: dotOnly ? 0 : (type.lineHeight - dotSize) / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
          }}
        />
      )}
      {!dotOnly && content(body, {
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
  /** Why it is empty and what to do next; a node can carry a link or emphasis. */
  description?: ReactNode;
  /** An icon name drawn as a quiet line icon, or your own element (an illustration, a KjunIcon of another size). */
  icon?: string | ReactElement;
  /** md for pages and panels; sm for cards and list areas. */
  size?: EmptySize;
  /** Marks the title as a header for screen readers (aria-level on the web); false keeps plain text. */
  headingLevel?: false | 2 | 3 | 4 | 5 | 6;
  /** polite announces the message when it appears (role status), such as a search that just came back empty. */
  live?: "polite" | "off";
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
/** Set by KjunListSection to its density: the empty note stays one row tall in the secondary body type, like Web's .kjun-list-empty. */
export const ListEmptyContext = createContext<false | "default" | "compact">(false);
// Stacked buttons fill the column the way stacked form actions do.
const stackedActions = { stacked: true };
// Like Web's keep-all: Korean wraps between words (iOS through its Hangul word strategy, a Text prop).
const emptyWords = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "break-word" } : {}) as unknown as TextStyle;
const emptyWordProps = { lineBreakStrategyIOS: "hangul-word" as const };
export function KjunEmpty({
  text,
  description,
  icon,
  size = "md",
  headingLevel = false,
  live = "off",
  style,
  children,
}: KjunEmptyProps) {
  const m = useKjunMessages();
  text ??= m.noData;
  const { colors } = useKjunStyles();
  const spec = tokens.extensions.empty, g = emptyGeometry(size);
  const inState = useContext(DataStateContentContext) === "empty", inList = useContext(ListEmptyContext);
  // Phones stack the actions in their own order, one full-width button per line.
  const stacked = useWindowDimensions().width <= tokens.responsive.empty;
  const title = inList ? { ...typeStyle('body'), color: colors.textSecondary }
    : { ...typeStyle('cardTitle'), color: colors.text, fontSize: g.titleSize, lineHeight: g.titleLineHeight };
  const heading = headingLevel ? { accessibilityRole: "header" as const, ...(Platform.OS === "web" ? { "aria-level": headingLevel } : {}) } : {};
  return (
    <View
      role={live === "polite" ? "status" : undefined}
      style={[{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spec.paddingX,
        paddingVertical: emptyPaddingY(size, { list: inList, state: inState }),
      }, style]}
    >
      {hasContent(icon) && (
        <View style={{ marginBottom: g.iconGap }}>
          {typeof icon === "string"
            ? <IconBase name={icon} size={g.iconSize} color={colors.textTertiary} strokeWidth={g.iconStroke} />
            : icon}
        </View>
      )}
      <KText {...emptyWordProps} {...heading} style={{ ...title, textAlign: "center", maxWidth: spec.textMaxWidth, ...emptyWords }}>
        {text}
      </KText>
      {hasContent(description) && (typeof description === "string" || typeof description === "number" ? (
        <KText
          {...emptyWordProps}
          style={{
            ...typeStyle('body'),
            fontSize: spec.descriptionSize,
            lineHeight: spec.descriptionLineHeight,
            color: colors.textSecondary,
            marginTop: spec.descriptionGap,
            textAlign: "center",
            maxWidth: spec.textMaxWidth,
            ...emptyWords,
          }}
        >
          {description}
        </KText>
      ) : (
        <View style={{ marginTop: spec.descriptionGap, maxWidth: spec.textMaxWidth, alignItems: "center" }}>{description}</View>
      ))}
      {hasContent(children) && (
        <View
          style={[
            { marginTop: g.actionGap, maxWidth: "100%", gap: spec.actionsGap },
            stacked ? { width: spec.actionsMaxWidth, alignItems: "stretch" } : { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
          ]}
        >
          {stacked ? <FormActionsContext.Provider value={stackedActions}>{content(children)}</FormActionsContext.Provider> : content(children)}
        </View>
      )}
    </View>
  );
}
export interface KjunSpinnerProps {
  size?: DisplaySize;
  text?: string;
}
export function KjunSpinner({ size = "md", text }: KjunSpinnerProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const stacked = !!text && spinnerStacked(size);
  // A live status like the Web role="status"; Android only announces with an explicit live region.
  return (
    <View
      accessible
      role="status"
      accessibilityLiveRegion="polite"
      accessibilityLabel={text || m.loading}
      style={{ flexDirection: stacked ? "column" : "row", alignItems: "center" }}
    >
      <KjunSpinnerGlyph size={tokens.extensions.spinner.sizes[size]} stroke={tokens.extensions.spinner.strokeWidths[size]} color={colors.brand} />
      {!!text && (
        <KText style={stacked ? { marginTop: tokens.dimension.value12, color: colors.textSecondary } : { marginLeft: tokens.dimension.value8, color: colors.textSecondary }}>
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
  /** An icon name in place of the tone's icon (its filled form when the icon has one), or false for no icon. */
  icon?: string | false;
  closable?: boolean;
  /** How screen readers announce it: assertive (role alert), polite (status) or off; defaults to alert for danger, status otherwise. */
  live?: AlertLive;
  children?: ReactNode;
  /** Buttons for the alert, under the message when it has a title and beside it otherwise; unsized KjunButtons follow the alert size. */
  actions?: ReactNode;
  onClose?: () => void;
}
// Each size steps the title line: sm 12/16, md 14/20, lg 16/24 (description stays caption on sm, body otherwise).
const titleType = { sm: "controlSmall", md: "control", lg: "controlLarge" } as const;
export function KjunAlert({
  type = "info",
  variant,
  size = "md",
  title,
  icon,
  closable = false,
  live,
  children,
  actions,
  onClose,
}: KjunAlertProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  const fade = useRef(new Animated.Value(1)).current, closing = useRef(false), root = useRef<any>(null);
  // A data state's buttons wrap, so its retry can give way beside the message (the web gets this from min-content).
  const wrapping = !!useContext(DataStateContentContext);
  if (!visible) return null;
  const tone = variant || (type === "error" ? "danger" : type),
    small = size === "sm", scale = size === "sm" || size === "lg" ? size : "md";
  const geometry = tokens.extensions.alert;
  const lineHeight = tokens.typography[titleType[scale]].lineHeightPx;
  const titled = hasContent(title);
  const closeSize = small ? geometry.sm.closeSize : geometry.closeSize;
  const paint = alertToneRoles(tone);
  const pick = (name: string) => colors[name.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as keyof typeof colors];
  // Korean wraps between words: iOS by its line-break strategy, Native Web by CSS; Android keeps its default.
  const words = { lineBreakStrategyIOS: "hangul-word" as const };
  const wordStyle = Platform.OS === "web" ? ({ wordBreak: "keep-all" } as object) : null;
  const text = (value: ReactNode, style: object) => typeof value === "string" || typeof value === "number"
    ? <KText {...words} style={[style, wordStyle]}>{value}</KText> : content(value, style);
  // Without a title the actions sit beside the message, centred on its first line, like a toast's.
  // In a narrow alert wrapping actions and the message give way in proportion to their length, as on the web.
  const beside = !titled && hasContent(actions), yielding = beside && wrapping;
  const actionBox = hasContent(actions) && (
    <ActionSizeContext.Provider value={alertActionSizes[scale]}>
      <AlertActionsContext.Provider value={true}>
        <View style={beside
          ? { flexDirection: "row", alignItems: "center", gap: geometry.actionsGap, flexShrink: yielding ? 1 : 0,
            marginVertical: (lineHeight - tokens.button.heights[alertActionSizes[scale]]) / 2 }
          : { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: geometry.actionsGap, marginTop: geometry[scale].actionGap }}>
          {content(actions)}
        </View>
      </AlertActionsContext.Provider>
    </ActionSizeContext.Provider>
  );
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    // Native Web hands focus on before the close button leaves; devices move accessibility focus themselves.
    if (Platform.OS === "web") keepFocusPastAlert(root.current as HTMLElement | null);
    const done = () => {
      // Devices collapse the freed space; Native Web removes the faded alert.
      if (!reduced && Platform.OS !== "web") LayoutAnimation.configureNext(LayoutAnimation.create(tokens.motion.collapse, "easeOut", "opacity"));
      setVisible(false);
      onClose?.();
    };
    if (reduced) { done(); return; }
    Animated.timing(fade, { toValue: 0, duration: tokens.motion.collapse, easing: motionOut, useNativeDriver: nativeDriver }).start(done);
  };
  return (
    <Animated.View
      ref={root}
      role={alertRole(tone, live)}
      accessibilityLiveRegion={alertLiveRegion(tone, live)}
      style={{
        opacity: fade,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: geometry[scale].gap,
        borderRadius: small ? geometry.sm.radius : geometry.radius,
        paddingVertical: geometry[scale].paddingY,
        paddingHorizontal: geometry[scale].paddingX,
        backgroundColor: paint.bg ? pick(paint.bg) : textTint(colors.text, "tintFill", colors.secondary),
      }}
    >
      {icon !== false && (
        <View style={{ height: lineHeight, justifyContent: "center", flexShrink: 0,
          // A triangle's optical center sits below its box center.
          transform: !icon && tone === "warning" ? [{ translateY: -geometry.warningIconLift }] : undefined }}>
          <KjunIcon name={icon || alertIcons[tone]} filled size={geometry.iconSizes[scale]} color={pick(paint.icon)} />
        </View>
      )}
      <View style={{ ...(yielding ? { flexGrow: 1, flexShrink: 1, flexBasis: "auto" } as const : { flex: 1 }), minWidth: 0, minHeight: lineHeight }}>
        {titled && text(title, { ...typeStyle(titleType[scale]), color: colors.text })}
        {hasContent(children) && <View style={{ marginTop: titled ? geometry.descriptionGap : 0 }}>
          {text(children, {
            ...typeStyle(small ? "caption" : "body"),
            color: colors.text,
          })}
        </View>}
        {!beside && actionBox}
      </View>
      {beside && actionBox}
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
            backgroundColor: pressed ? textTint(colors.text, "tintActive", colors.active)
              : hovered ? textTint(colors.text, "tintHover", colors.hover) : "transparent",
          })}
          onPress={close}
        >
          {({ pressed, hovered }: any) => <KjunIcon name="x" size={geometry.closeIconSize}
            color={pressed || hovered ? colors.text : textTint(colors.text, "muted", colors.textTertiary)} />}
        </Pressable>
      )}
    </Animated.View>
  );
}
export { KjunProgress, type KjunProgressProps } from "./progress";
