import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { typeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import { useContext,useEffect,useId,useRef,useState,type ReactNode } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { sameEdges, scrollEdges, type ScrollEdges, type ScrollFadeDirection } from "../../../shared/package-runtime/scroll-fade";
import { AccessibilityInfo,Platform,ScrollView,View,type GestureResponderEvent,type ColorValue,type StyleProp,type ViewStyle } from "react-native";
import { externalLinkIconName, safeExternalUrl } from "../../../shared/package-runtime/external-link";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton,KjunIcon,type KjunButtonProps } from "./button";
import { KText,content,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { useOptionalKjunFeedback } from "./feedback-context";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
import { TopNavigationContext } from "./top-navigation-context";
import { useCopyFeedback } from "../../../shared/package-runtime/use-copy-feedback";
import { copyButtonGeometry } from "../../../shared/package-runtime/copy-button";
import { usePendingAction } from "../../../shared/package-runtime/use-pending-action";
export interface KjunIconToggleProps {
  active?: boolean;
  activeIcon: string;
  inactiveIcon?: string;
  activeColor?: ColorValue;
  inactiveColor?: ColorValue;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel: string;
  /** Defaults to ariaLabel, like RefreshButton; an empty string disables the hint. */
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  onToggle?: () => void;
}
export function KjunIconToggle({
  active = false,
  activeIcon,
  inactiveIcon,
  activeColor,
  inactiveColor,
  size = "md",
  disabled = false,
  loading = false,
  ariaLabel,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  onToggle,
}: KjunIconToggleProps) {
  const { colors } = useKjunStyles();
  const navigation = useContext(TopNavigationContext);
  const box = navigation ? navigation.controlSize : size === "xs" ? tokens.extensions.iconToggle.compactSize : tokens.extensions.iconToggle.sizes[size];
  // The pressable is the painted square, as on Web; hitSlop reaches the 44pt touch target around it, like KjunButton.
  const hit = Math.max(0, (tokens.native.minimumTouchTarget - box) / 2);
  return (
    <KjunTooltip content={disabled || loading ? "" : tooltip ?? ariaLabel} placement={tooltipPlacement} delay={tooltipDelay}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      accessibilityState={{
        selected: active,
        busy: loading,
        disabled: disabled || loading,
      }}
      disabled={disabled || loading}
      hitSlop={{ top: hit, bottom: hit, left: hit, right: hit }}
      onPress={onToggle}
      {...(Platform.OS === "web" ? {
        onKeyDown: (event: { key: string; preventDefault(): void; stopPropagation(): void }) => {
          // A focused button may become disabled while its parent is still pressable.
          if ((disabled || loading) && ["Enter", " ", "Spacebar"].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
          }
        },
      } : {})}
      style={({ pressed }) => ({
        // Keep disabled web buttons in hit testing so clicks cannot reach the row.
        ...(Platform.OS === "web" ? { pointerEvents: "auto" as const } : {}),
        // The visible square follows the icon-toggle scale; the 44pt touch target comes from hitSlop.
        alignSelf: "flex-start",
        width: box,
        height: box,
        alignItems: "center",
        justifyContent: "center",
        ...(navigation ? { flexShrink: 0 } : {}),
        borderRadius: tokens.extensions.iconToggle.radii[size],
        // Loading blocks presses but stays legible; only disabled dims.
        opacity: disabled ? tokens.states.opacity.disabled : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
      <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center", borderRadius: tokens.extensions.iconToggle.radii[size], backgroundColor: !disabled && !loading && (pressed || hovered) ? colors.hover : "transparent" }}>
      {loading ? (
        <KjunSpinnerGlyph size={navigation?.iconSize ?? tokens.button.iconSizes[size]} color={colors.text} />
      ) : (
        <KjunIcon
          name={active ? activeIcon : inactiveIcon || activeIcon}
          filled={active}
          size={navigation?.iconSize ?? tokens.button.iconSizes[size]}
          color={
            active
              ? activeColor ?? colors.brand
              : hovered && !disabled && !loading
                ? colors.textSecondary
                : inactiveColor ?? colors.textTertiary
          }
        />
      )}
      </View>
      )}
    </Pressable>
    </KjunTooltip>
  );
}
export interface KjunCopyButtonProps {
  value: string;
  ariaLabel?: string;
  text?: string;
  successText?: string;
  inline?: boolean;
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
  copyText: (value: string) => void | Promise<void>;
  onCopied?: (value: string) => void;
  onCopyError?: (error: unknown) => void;
}
export function KjunCopyButton({
  value,
  ariaLabel,
  text,
  successText,
  inline = false,
  size = "sm",
  disabled = false,
  copyText,
  onCopied,
  onCopyError,
}: KjunCopyButtonProps) {
  const m = useKjunMessages();
  successText ??= m.copied;
  const feedback = useOptionalKjunFeedback(),
    { colors } = useKjunStyles(),
    [said, setSaid] = useState("");
  // Without a feedback provider the result is announced: devices speak it directly, the web through a
  // status region that fills on change. A hint would not be read when it changes.
  const say = (message: string) => {
    if (feedback) return;
    if (Platform.OS === "web") setSaid(message);
    else AccessibilityInfo.announceForAccessibility(message);
  };
  const { copied, copy } = useCopyFeedback(copyText, {
    onSuccess: (copiedValue) => { feedback?.toast.success(successText); say(successText); onCopied?.(copiedValue); },
    onError: (error) => { feedback?.toast.error(m.copyFailed); say(m.copyFailed); onCopyError?.(error); },
  });
  // Clear the region when the success state ends, so the next copy is announced again.
  useEffect(() => { if (!copied) setSaid(""); }, [copied]);
  // Painted like Web: ghost-button geometry for the size; hitSlop reaches the 44pt touch target.
  const geometry = copyButtonGeometry(size, !!text && !inline),
    hitY = Math.max(0, (tokens.native.minimumTouchTarget - geometry.height) / 2),
    hitX = geometry.width == null ? 0 : Math.max(0, (tokens.native.minimumTouchTarget - geometry.width) / 2);
  type State = { pressed: boolean; hovered?: boolean };
  // Hover and press take the hover fill and the full text ink, as on Web.
  const active = ({ pressed, hovered }: State) => !disabled && (pressed || !!hovered);
  return (
    <View>
      <Pressable
        disabled={disabled}
        hitSlop={{ top: hitY, bottom: hitY, left: hitX, right: hitX }}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel || text || m.copy}
        onPress={() => void copy(value)}
        style={(state) => ({
          alignSelf: "flex-start",
          minHeight: geometry.height,
          width: geometry.width,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: geometry.gap,
          paddingStart: geometry.paddingStart,
          paddingEnd: geometry.paddingEnd,
          borderRadius: geometry.radius,
          backgroundColor: active(state as State) ? colors.hover : undefined,
          opacity: disabled ? tokens.states.opacity.disabled : 1,
        })}
      >
        {(state: State) => <>
          <KjunIcon
            name={copied ? "check" : "copy"}
            size={tokens.button.iconSizes[size]}
            color={copied ? colors.success : active(state) ? colors.text : colors.textSecondary}
          />
          {!!text && !inline && (
            <KText
              style={{
                ...typeStyle(size === "xs" ? "controlSmall" : "control"),
                color: active(state) ? colors.text : colors.textSecondary,
              }}
            >
              {copied ? successText : text}
            </KText>
          )}
        </>}
      </Pressable>
      {Platform.OS === "web" ? <View role="status" pointerEvents="none" style={{ position: "absolute", opacity: 0 }}><KText>{said}</KText></View> : null}
    </View>
  );
}
export interface KjunRefreshButtonProps
  extends Omit<KjunButtonProps, "onPress" | "children" | "prefix" | "suffix"> {
  targetName?: string;
  mode?: "icon" | "text";
  text?: string;
  /** Defaults to the icon button's accessible label; an empty string disables it. */
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  /** A returned promise shows loading until it settles; loading stays the app's to set otherwise. */
  onRefresh?: () => void | Promise<unknown>;
}
export function KjunRefreshButton({
  targetName = "",
  mode = "icon",
  text,
  size = "sm",
  variant = "ghost",
  ariaLabel,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  spinOnLoading = true,
  loading = false,
  onRefresh,
  ...props
}: KjunRefreshButtonProps) {
  const m = useKjunMessages();
  text ??= m.refresh;
  const reduced = useReducedMotion();
  const { pending, run } = usePendingAction();
  const busy = loading || pending;
  // Text mode speaks what it shows (WCAG 2.5.3); icon mode keeps the action name.
  const label = ariaLabel || [targetName, mode === "text" ? text : m.refresh].filter(Boolean).join(" ");
  const hint = tooltip ?? (mode === "icon" ? label : "");
  const button = (
    <KjunTooltip content={props.disabled || busy ? "" : hint} placement={tooltipPlacement} delay={tooltipDelay}>
    <KjunButton
      {...props}
      size={size}
      variant={variant}
      loading={busy}
      prefixIcon="refresh"
      spinOnLoading={!reduced && spinOnLoading}
      ariaLabel={label}
      onPress={() => run(onRefresh)}
    >
      {mode === "text" ? text : undefined}
    </KjunButton>
    </KjunTooltip>
  );
  return props.block ? <View style={{ alignSelf: "stretch", width: "100%" }}>{button}</View> : button;
}
export interface KjunExternalLinkProps {
  href?: string;
  mode?: "icon" | "text";
  /** The icon link's name (default "External link"); a text link shows it when it has no children. */
  label?: string;
  children?: ReactNode;
  openUrl: (url: string) => void | Promise<void>;
  /** Called when the link is pressed, before openUrl (e.g. for analytics). */
  onPress?: (event: GestureResponderEvent) => void;
}
/** Opens only http(s) URLs through openUrl; anything else renders as plain text. */
export function KjunExternalLink({
  href = "",
  mode = "text",
  label,
  children,
  openUrl,
  onPress,
}: KjunExternalLinkProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    url = safeExternalUrl(href), icon = mode === "icon",
    name = icon ? externalLinkIconName(label, m.externalLink) : undefined,
    text = children ?? label,
    body = icon ? (
      <KjunIcon name="external-link" color={colors.text} />
    ) : (
      // Like Web, text links are underlined so they read as links within body text. Native cannot offset a text
      // underline, so a 1px line is drawn under the text, which overhangs it by the line box's spare room below the
      // glyphs; that leaves Web's gap under the glyphs on every platform.
      <View style={{ borderBottomWidth: tokens.border.defaultWidth, borderColor: colors.text }}>{content(text, { marginBottom: -tokens.dimension.value3 })}</View>
    );
  // Like Web: an icon link is named by its label, a text link by its own text, and both say they open elsewhere.
  const plain = typeof text === "string" || typeof text === "number" ? String(text) : undefined;
  const linkName = name ? name + m.newWindow : (plain !== undefined ? plain + m.newWindow : undefined);
  return url ? (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={linkName}
      // Text that is not a plain string keeps its own reading; the new-window cue becomes a hint.
      accessibilityHint={linkName === undefined ? m.newWindow.trim() : undefined}
      onPress={(event: GestureResponderEvent) => { onPress?.(event); void openUrl(url); }}
      // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
      style={{ alignSelf: "flex-start", minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}
    >
      {icon ? body : (
        // Like Web, text links show the new-window cue after the text.
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4 }}>
          {body}
          <KjunIcon name="external-link" size={tokens.iconSizes.small} color={colors.text} />
        </View>
      )}
    </Pressable>
  ) : (
    // Not a link: the text stays, and an icon keeps its name for screen readers.
    <View {...(name ? { accessible: true, accessibilityLabel: name } : {})}>{body}</View>
  );
}
export interface KjunScrollFadeProps {
  children?: ReactNode;
  /** Which way the content scrolls; vertical needs a height (style) to scroll within. */
  direction?: ScrollFadeDirection;
  /** The colour the edges fade into: the surface behind the scroller (default surface). */
  fadeColor?: ColorValue;
  /** Names the scroller for screen readers. */
  ariaLabel?: string;
  style?: StyleProp<ViewStyle>;
}
/** Fades whichever edge along `direction` still has content to scroll to, like Web, with a gradient into fadeColor. */
export function KjunScrollFade({ children, direction = "horizontal", fadeColor, ariaLabel, style }: KjunScrollFadeProps) {
  const { colors } = useKjunStyles(), color = fadeColor ?? colors.surface;
  const horizontal = direction === "horizontal", width = tokens.extensions.scrollFade.width;
  const ringRoom = tokens.states.focus.width + tokens.states.focus.offset;
  const box = useRef({ scrollLeft: 0, scrollTop: 0, clientWidth: 0, clientHeight: 0, scrollWidth: 0, scrollHeight: 0 });
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });
  const id = "kjun-scroll-fade-" + useId().replace(/:/g, "");
  const update = (next: Partial<typeof box.current>) => {
    box.current = { ...box.current, ...next };
    const found = scrollEdges(box.current, direction);
    setEdges(previous => sameEdges(previous, found) ? previous : found);
  };
  const fade = (edge: "start" | "end") => (
    <View pointerEvents="none" style={{ position: "absolute", ...(horizontal
      ? { top: 0, bottom: 0, width, ...(edge === "start" ? { left: 0 } : { right: 0 }) }
      : { left: 0, right: 0, height: width, ...(edge === "start" ? { top: 0 } : { bottom: 0 }) }) }}>
      <Svg width="100%" height="100%">
        <Defs><LinearGradient id={id + edge} x1="0%" y1="0%" x2={horizontal ? "100%" : "0%"} y2={horizontal ? "0%" : "100%"}>
          <Stop offset="0" stopColor={color} stopOpacity={edge === "start" ? 1 : 0} />
          <Stop offset="1" stopColor={color} stopOpacity={edge === "start" ? 0 : 1} />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${id + edge})`} />
      </Svg>
    </View>
  );
  return (
    <View style={[{ flexGrow: 0, position: "relative" }, horizontal ? { maxWidth: "100%" } : { maxHeight: "100%" }, style]} accessibilityLabel={ariaLabel}
      {...(Platform.OS === "web" && ariaLabel ? { role: "region" as const } : {})}>
      <ScrollView
        horizontal={horizontal}
        // Shrinks to the wrapper's max size (the app's style), so it scrolls inside it instead of growing past it.
        // Room for an item's focus ring, which the scroller would clip; the negative margin keeps the items on the page's lines, as on Web.
        style={{ flexGrow: 0, flexShrink: 1, margin: -ringRoom }}
        contentContainerStyle={{ padding: ringRoom }}
        // The fade shows where content continues, so the bars stay hidden as on Web.
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onLayout={event => update({ clientWidth: event.nativeEvent.layout.width, clientHeight: event.nativeEvent.layout.height })}
        onContentSizeChange={(scrollWidth, scrollHeight) => update({ scrollWidth, scrollHeight })}
        onScroll={event => update({ scrollLeft: event.nativeEvent.contentOffset.x, scrollTop: event.nativeEvent.contentOffset.y })}
      >
        {children}
      </ScrollView>
      {edges.start ? fade("start") : null}
      {edges.end ? fade("end") : null}
    </View>
  );
}
