import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { View, useWindowDimensions, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import {
  clampLines, isNumericVariant, stackGapAt, titleVariants,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackBreakpoint, type StackGap, type StackGapValue, type StackJustify,
  type TextAlign, type TextDecoration, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { KjunFormGroup } from "./input";
import { KjunButton } from "./button";
import { KjunBadge } from "./display-primitives";
import { FontText, KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackBreakpoint, StackGap, StackGapValue, StackJustify, TextAlign, TextDecoration, TextTone, TextVariant };

/** Other React Native Text props (accessibilityLabel, testID, selectable, allowFontScaling, adjustsFontSizeToFit…) pass through.
 * adjustsFontSizeToFit only shrinks: the variant size stays the largest. */
export interface KjunTextProps extends Omit<TextProps, "style" | "children" | "numberOfLines"> {
  /** Typography role; every size, line height and weight comes from tokens.typography.
   * "inherit" is for a KjunText nested in another: it keeps the outer text's size, weight and, with the default tone, color. */
  variant?: TextVariant;
  /** Text color role. */
  tone?: TextTone;
  align?: TextAlign;
  /** Clamp to this many lines with an ellipsis (numberOfLines). */
  maxLines?: number;
  /** Fixed-width digits, so amounts in a column line up. Size and weight stay the variant's. */
  numeric?: boolean;
  /** "lineThrough" strikes the text, e.g. a price before a discount. */
  decoration?: TextDecoration;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}
const toneRole = { default: "text", secondary: "textSecondary", tertiary: "textTertiary", disabled: "textDisabled",
  brand: "brand", danger: "danger", success: "success", warning: "warning", info: "info",
  inverse: "onBrand", onBrand: "onBrand", onDanger: "onDanger", onSuccess: "onSuccess", onWarning: "onWarning" } as const;
const textAlign = { start: "left", center: "center", end: "right" } as const;
export function KjunText({ variant = "body", tone = "default", align, maxLines, numeric, decoration, style, children, ...rest }: KjunTextProps) {
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  const lines = clampLines(maxLines);
  const inherit = variant === "inherit";
  // A nested Text inherits its parent's type on Native, so inherit sets no size and, at the default tone, no color.
  const Root = inherit ? FontText : KText;
  return (
    <Root
      {...rest}
      // An explicit undefined (cond ? "link" : undefined) keeps the heading role of title variants.
      accessibilityRole={rest.accessibilityRole ?? (titleVariants.includes(variant) ? "header" : undefined)}
      numberOfLines={lines}
      ellipsizeMode={lines ? "tail" : undefined}
      style={[
        inherit ? null : typeStyle(variant),
        inherit && tone === "default" ? null : { color: colors[toneRole[tone]] },
        isNumericVariant(variant) ? { fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] } : null,
        numeric ? { fontVariant: ["tabular-nums"] } : null,
        decoration === "lineThrough" ? { textDecorationLine: "line-through" } : null,
        align ? { textAlign: textAlign[align] } : null,
        style,
      ]}
    >
      {children}
    </Root>
  );
}

// Like Web's `> .kjun-form-group` rule: only a direct form group drops its own bottom margin, and raw strings
// become body text (a bare string inside a View crashes on Native). Fragments are opened first, so their strings
// and form groups count as direct children too.
// Children.toArray keeps an app's own key (".$a") and gives an unkeyed child its place (".0"), so a keyed list keeps
// each item's state when items are added or moved; the path keeps keys apart across fragments.
function flatten(children: ReactNode, path = ""): [string, ReactNode][] {
  return Children.toArray(children).flatMap((child, i): [string, ReactNode][] => {
    const key = `${path}${isValidElement(child) && child.key != null ? child.key : i}`;
    return isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? flatten(child.props.children, `${key}.`) : [[key, child]];
  });
}
// Native buttons and badges sit at flex-start on their own. When the app names an alignment, a direct button
// or badge takes it as alignSelf (Web already follows the parent); the default and stretch keep flex-start,
// and the child's own style.alignSelf still wins.
type ChildAlign = "flex-start" | "center" | "flex-end" | "baseline";
function items(children: ReactNode, childAlign?: ChildAlign) {
  return flatten(children).map(([key, child]) => {
    if (typeof child === "string" || typeof child === "number") return <KText key={key}>{child}</KText>;
    if (isValidElement(child) && child.type === KjunFormGroup) {
      const group = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(group, { key, style: [{ marginBottom: 0 }, group.props.style] });
    }
    if (childAlign && isValidElement(child) && (child.type === KjunButton || child.type === KjunBadge)) {
      const control = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(control, { key, style: [{ alignSelf: childAlign }, control.props.style] });
    }
    return isValidElement(child) ? cloneElement(child, { key }) : child;
  });
}
const followed = (align: StackAlign | InlineAlign | undefined): ChildAlign | undefined =>
  align && align !== "stretch" ? crossAxis[align] : undefined;

const stackGap: Record<StackGap, number> = {
  none: 0, xs: tokens.space.stack.xs, sm: tokens.space.stack.sm, md: tokens.space.stack.md, lg: tokens.space.stack.lg,
  "section-sm": tokens.space.section.sm, "section-md": tokens.space.section.md, "section-lg": tokens.space.section.lg,
};
const inlineGap: Record<InlineGap, number> = {
  none: 0, xs: tokens.space.inline.xs, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg,
};
const crossAxis = { stretch: "stretch", start: "flex-start", center: "center", end: "flex-end", baseline: "baseline" } as const;
const mainAxis = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" } as const;

const breakpoints: Record<StackBreakpoint, number> = { compact: tokens.responsive.stackCompact, medium: tokens.responsive.stackMedium, wide: tokens.responsive.stackWide };
/** Other View props (testID, accessibilityRole, accessibilityLabel, nativeID, onLayout, pointerEvents…) pass through. */
export interface KjunStackProps extends Omit<ViewProps, "style" | "children"> {
  /** Space between children: space.stack (xs·sm·md·lg) or space.section (section-sm·md·lg). An object changes it with the
   * window width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap?: StackGapValue;
  /** Cross-axis alignment. Buttons and badges keep their own width under stretch (the default), as on Web. */
  align?: StackAlign;
  /** How children share spare height when the stack is taller than they are: between puts the first at the top and the last at the bottom. */
  justify?: StackJustify;
  /** A hairline in the divider color between children, with the gap above and below it. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export function KjunStack({ gap, align, justify = "start", divider = false, style, children, ...rest }: KjunStackProps) {
  const { colors } = useKjunStyles(), { width } = useWindowDimensions();
  const rows = items(children, followed(align));
  const content = divider ? rows.flatMap((row, index) => index
    ? [<View key={"kjun-divider-" + index} aria-hidden={true} style={{ alignSelf: "stretch", height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />, row] : [row]) : rows;
  return <View {...rest} style={[{ flexDirection: "column", alignItems: crossAxis[align ?? "stretch"], justifyContent: mainAxis[justify],
    gap: stackGap[stackGapAt(gap, width, breakpoints)], minWidth: 0 }, style]}>{content}</View>;
}

/** Other View props (testID, accessibilityRole, accessibilityLabel, nativeID, onLayout, pointerEvents…) pass through. */
export interface KjunInlineProps extends Omit<ViewProps, "style" | "children"> {
  /** Space between children: space.inline (xs·sm·md·lg). */
  gap?: InlineGap;
  align?: InlineAlign;
  justify?: InlineJustify;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export function KjunInline({ gap = "sm", align, justify = "start", wrap = true, style, children, ...rest }: KjunInlineProps) {
  return (
    <View {...rest} style={[{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", alignItems: crossAxis[align ?? "center"],
      justifyContent: mainAxis[justify], gap: inlineGap[gap], minWidth: 0 }, style]}>
      {items(children, followed(align))}
    </View>
  );
}
