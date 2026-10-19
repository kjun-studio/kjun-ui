import { typeStyle } from "./typography";
import { tokens,type ButtonSize } from "@kjun-ui/tokens";
import { useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { Platform,ScrollView,View,type ColorValue } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton,KjunIcon,type KjunButtonProps } from "./button";
import { KjunSpinner } from "./display";
import { KText,content,useReducedMotion } from "./internal";
import { useKjunStyles } from "./provider";
import { useOptionalKjunFeedback } from "./feedback-context";
import { KjunTooltip, type KjunTooltipProps } from "./popover";
import { TopNavigationContext } from "./top-navigation-context";
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
        // The touch target stays 44pt; the visible square follows the icon-toggle scale.
        alignSelf: "flex-start",
        minWidth: Math.max(tokens.native.minimumTouchTarget, box),
        minHeight: Math.max(tokens.native.minimumTouchTarget, box),
        alignItems: "center",
        justifyContent: "center",
        ...(navigation ? { width: navigation.controlSize, height: navigation.controlSize, flexShrink: 0 } : {}),
        borderRadius: tokens.extensions.iconToggle.radii[size],
        // Loading blocks presses but stays legible; only disabled dims.
        opacity: disabled ? tokens.states.opacity.disabled : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => (
      <View style={{ width: box, height: box, alignItems: "center", justifyContent: "center", borderRadius: tokens.extensions.iconToggle.radii[size], backgroundColor: !disabled && !loading && (pressed || hovered) ? colors.hover : "transparent" }}>
      {loading ? (
        navigation ? <KjunIcon name="loader-2" spin size={navigation.iconSize} /> : <KjunSpinner size="sm" />
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
  successText = "복사됨",
  inline = false,
  size = "sm",
  disabled = false,
  copyText,
  onCopied,
  onCopyError,
}: KjunCopyButtonProps) {
  const feedback = useOptionalKjunFeedback(),
    { colors } = useKjunStyles(),
    [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false),
    busy = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <View>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={ariaLabel || text || "복사"}
        accessibilityHint={
          feedback ? undefined : copied ? successText : failed ? "복사 실패" : undefined
        }
        onPress={async () => {
          if (copied || busy.current) return;
          busy.current = true;
          try {
            await copyText(value);
            if (mounted.current) {
              setCopied(true);
              setFailed(false);
              feedback?.toast.success(successText);
              onCopied?.(value);
              timer.current = setTimeout(() => setCopied(false), 1500);
            }
          } catch (error) {
            if (mounted.current) {
              setFailed(true);
              feedback?.toast.error("복사 실패");
              onCopyError?.(error);
            }
          } finally {
            busy.current = false;
          }
        }}
        style={({ pressed }) => ({
          alignSelf: "flex-start",
          minWidth: tokens.native.minimumTouchTarget,
          minHeight: tokens.native.minimumTouchTarget,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: tokens.dimension.value6,
          paddingHorizontal: { xs: tokens.dimension.value2, sm: tokens.dimension.value8, md: tokens.dimension.value12 }[size],
          paddingVertical: { xs: tokens.dimension.value2, sm: tokens.dimension.value4, md: tokens.dimension.value6 }[size],
          borderRadius: tokens.radius.radius6,
          backgroundColor: pressed && !inline ? colors.hover : undefined,
          opacity: disabled ? tokens.states.opacity.disabled : 1,
        })}
      >
        <KjunIcon
          name={copied ? "check" : "copy"}
          size={tokens.button.iconSizes[size]}
          color={copied ? colors.success : colors.textSecondary}
        />
        {!!text && !inline && (
          <KText
            style={{
              ...typeStyle(size === "xs" ? "controlSmall" : "control"),
              color: colors.textSecondary,
            }}
          >
            {copied ? successText : text}
          </KText>
        )}
      </Pressable>
    </View>
  );
}
export interface KjunRefreshButtonProps
  extends Omit<KjunButtonProps, "onPress" | "children"> {
  targetName?: string;
  mode?: "icon" | "text";
  text?: string;
  /** Defaults to the icon button's accessible label; an empty string disables it. */
  tooltip?: string;
  tooltipPlacement?: KjunTooltipProps["placement"];
  tooltipDelay?: number;
  onRefresh?: () => void;
}
export function KjunRefreshButton({
  targetName = "",
  mode = "icon",
  text = "새로고침",
  size = "sm",
  variant = "ghost",
  ariaLabel,
  tooltip,
  tooltipPlacement,
  tooltipDelay,
  spinOnLoading = true,
  onRefresh,
  ...props
}: KjunRefreshButtonProps) {
  const reduced = useReducedMotion();
  // Text mode speaks what it shows (WCAG 2.5.3); icon mode keeps the action name.
  const label = ariaLabel || [targetName, mode === "text" ? text : "새로고침"].filter(Boolean).join(" ");
  const hint = tooltip ?? (mode === "icon" ? label : "");
  const button = (
    <KjunTooltip content={props.disabled || props.loading ? "" : hint} placement={tooltipPlacement} delay={tooltipDelay}>
    <KjunButton
      {...props}
      size={size}
      variant={variant}
      prefixIcon="refresh"
      spinOnLoading={!reduced && spinOnLoading}
      ariaLabel={label}
      onPress={onRefresh}
    >
      {mode === "text" ? text : undefined}
    </KjunButton>
    </KjunTooltip>
  );
  return props.block ? <View style={{ alignSelf: "stretch", width: "100%" }}>{button}</View> : button;
}
export function safeExternalUrl(href: string) {
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
export interface KjunExternalLinkProps {
  href?: string;
  mode?: "icon" | "text";
  label?: string;
  children?: ReactNode;
  openUrl: (url: string) => void | Promise<void>;
}
export function KjunExternalLink({
  href = "",
  mode = "text",
  label,
  children,
  openUrl,
}: KjunExternalLinkProps) {
  const { colors } = useKjunStyles(),
    url = safeExternalUrl(href),
    name = label || (mode === "icon" ? "외부 링크" : undefined),
    body =
      mode === "icon" ? (
        <KjunIcon name="external-link" color={colors.text} />
      ) : (
        content(children)
      );
  return url ? (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={name ? name + " (새 창)" : undefined}
      onPress={() => openUrl(url)}
      // Content width like Web; a column parent would otherwise stretch the hit area and focus ring.
      style={{ alignSelf: "flex-start", minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}
    >
      {mode === "text" ? (
        // Like Web, text links show the new-window cue after the text.
        <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4 }}>
          {body}
          <KjunIcon name="external-link" size={tokens.iconSizes.small} color={colors.text} />
        </View>
      ) : body}
    </Pressable>
  ) : (
    <View>{body}</View>
  );
}
export function KjunScrollFade({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      style={{ flexGrow: 0, maxWidth: "100%" }}
    >
      {children}
    </ScrollView>
  );
}
