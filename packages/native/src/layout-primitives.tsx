import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import {
  clampLines, isNumericVariant, titleVariants,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackGap,
  type TextAlign, type TextDecoration, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { KjunFormGroup } from "./input";
import { KjunButton } from "./button";
import { KjunBadge } from "./display-primitives";
import { FontText, KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackGap, TextAlign, TextDecoration, TextTone, TextVariant };

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
function flatten(children: ReactNode, path = ""): [string, ReactNode][] {
  return Children.toArray(children).flatMap((child, i): [string, ReactNode][] => {
    const key = `${path}${i}`;
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
  none: 0, sm: tokens.space.stack.sm, md: tokens.space.stack.md, lg: tokens.space.stack.lg,
  "section-sm": tokens.space.section.sm, "section-md": tokens.space.section.md, "section-lg": tokens.space.section.lg,
};
const inlineGap: Record<InlineGap, number> = {
  none: 0, xs: tokens.space.inline.xs, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg,
};
const crossAxis = { stretch: "stretch", start: "flex-start", center: "center", end: "flex-end", baseline: "baseline" } as const;
const mainAxis = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" } as const;

export interface KjunStackProps {
  /** Space between children: space.stack (sm·md·lg) or space.section (section-sm·md·lg). */
  gap?: StackGap;
  align?: StackAlign;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export function KjunStack({ gap = "md", align, style, children }: KjunStackProps) {
  return <View style={[{ flexDirection: "column", alignItems: crossAxis[align ?? "stretch"], gap: stackGap[gap], minWidth: 0 }, style]}>{items(children, followed(align))}</View>;
}

export interface KjunInlineProps {
  /** Space between children: space.inline (xs·sm·md·lg). */
  gap?: InlineGap;
  align?: InlineAlign;
  justify?: InlineJustify;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export function KjunInline({ gap = "sm", align, justify = "start", wrap = true, style, children }: KjunInlineProps) {
  return (
    <View style={[{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", alignItems: crossAxis[align ?? "center"],
      justifyContent: mainAxis[justify], gap: inlineGap[gap], minWidth: 0 }, style]}>
      {items(children, followed(align))}
    </View>
  );
}
