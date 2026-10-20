import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import {
  isNumericVariant, titleVariants,
  type InlineAlign, type InlineGap, type InlineJustify, type StackAlign, type StackGap,
  type TextAlign, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { KjunFormGroup } from "./input";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { InlineAlign, InlineGap, InlineJustify, StackAlign, StackGap, TextAlign, TextTone, TextVariant };

export interface KjunTextProps {
  /** Typography role; every size, line height and weight comes from tokens.typography. */
  variant?: TextVariant;
  /** Text color role. */
  tone?: TextTone;
  align?: TextAlign;
  /** Clamp to this many lines with an ellipsis (numberOfLines). */
  maxLines?: number;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}
const toneRole = { default: "text", secondary: "textSecondary", tertiary: "textTertiary", disabled: "textDisabled" } as const;
const textAlign = { start: "left", center: "center", end: "right" } as const;
export function KjunText({ variant = "body", tone = "default", align, maxLines, style, children }: KjunTextProps) {
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  const lines = maxLines && maxLines > 0 ? Math.floor(maxLines) : undefined;
  return (
    <KText
      accessibilityRole={titleVariants.includes(variant) ? "header" : undefined}
      numberOfLines={lines}
      ellipsizeMode={lines ? "tail" : undefined}
      style={[
        typeStyle(variant),
        { color: colors[toneRole[tone]] },
        isNumericVariant(variant) ? { fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] } : null,
        align ? { textAlign: textAlign[align] } : null,
        style,
      ]}
    >
      {children}
    </KText>
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
function items(children: ReactNode) {
  return flatten(children).map(([key, child]) => {
    if (typeof child === "string" || typeof child === "number") return <KText key={key}>{child}</KText>;
    if (isValidElement(child) && child.type === KjunFormGroup) {
      const group = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(group, { key, style: [{ marginBottom: 0 }, group.props.style] });
    }
    return isValidElement(child) ? cloneElement(child, { key }) : child;
  });
}

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
export function KjunStack({ gap = "md", align = "stretch", style, children }: KjunStackProps) {
  return <View style={[{ flexDirection: "column", alignItems: crossAxis[align], gap: stackGap[gap], minWidth: 0 }, style]}>{items(children)}</View>;
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
export function KjunInline({ gap = "sm", align = "center", justify = "start", wrap = true, style, children }: KjunInlineProps) {
  return (
    <View style={[{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", alignItems: crossAxis[align],
      justifyContent: mainAxis[justify], gap: inlineGap[gap], minWidth: 0 }, style]}>
      {items(children)}
    </View>
  );
}
