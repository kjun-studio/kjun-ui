import { Children, Fragment, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import {
  clampLines, dividerVariant, interleave, isNumericVariant, isResponsive, responsiveSteps, stackGapSteps, stepAt, titleVariants,
  type DirectionValue, type FlexDirection, type InlineAlign, type InlineGap, type InlineGapValue, type InlineJustify, type InsetStep, type LegacyStackGap,
  type PaddingValue, type Responsive, type ResponsiveBasis, type StackAlign, type StackBreakpoint, type StackDivider, type StackGap, type StackGapValue,
  type StackJustify, type TextAlign, type TextDecoration, type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { KjunFormGroup } from "./input";
import { KjunButton } from "./button";
import { KjunBadge } from "./display-primitives";
import { KjunChip } from "./chip";
import { FontText, KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { DirectionValue, FlexDirection, InlineAlign, InlineGap, InlineGapValue, InlineJustify, InsetStep, LegacyStackGap, PaddingValue, Responsive,
  ResponsiveBasis, StackAlign, StackBreakpoint, StackDivider, StackGap, StackGapValue, StackJustify, TextAlign, TextDecoration, TextTone, TextVariant };

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
// Native buttons, badges and chips sit at flex-start on their own. When the app names an alignment, a direct one
// takes it as alignSelf (Web already follows the parent); the default and stretch keep flex-start,
// and the child's own style.alignSelf still wins.
type ChildAlign = "flex-start" | "center" | "flex-end" | "baseline";
function items(children: ReactNode, childAlign?: ChildAlign) {
  return flatten(children).map(([key, child]) => {
    if (typeof child === "string" || typeof child === "number") return <KText key={key}>{child}</KText>;
    if (isValidElement(child) && child.type === KjunFormGroup) {
      const group = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(group, { key, style: [{ marginBottom: 0 }, group.props.style] });
    }
    if (childAlign && isValidElement(child) && (child.type === KjunButton || child.type === KjunBadge || child.type === KjunChip)) {
      const control = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(control, { key, style: [{ alignSelf: childAlign }, control.props.style] });
    }
    return isValidElement(child) ? cloneElement(child, { key }) : child;
  });
}
const followed = (align: StackAlign | InlineAlign | undefined): ChildAlign | undefined =>
  align && align !== "stretch" ? crossAxis[align] : undefined;

const stackGap: Record<StackGap, number> = {
  none: 0, xs: tokens.space.stack.xs, sm: tokens.space.stack.sm, smMd: tokens.space.stack.smMd, md: tokens.space.stack.md, lg: tokens.space.stack.lg,
  sectionSm: tokens.space.section.sm, sectionMd: tokens.space.section.md, sectionLg: tokens.space.section.lg,
};
const inlineGap: Record<InlineGap, number> = {
  none: 0, xs: tokens.space.inline.xs, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg,
};
const inset: Record<InsetStep, number> = { none: 0, sm: tokens.space.inset.sm, md: tokens.space.inset.md, lg: tokens.space.inset.lg };
const crossAxis = { stretch: "stretch", start: "flex-start", center: "center", end: "flex-end", baseline: "baseline" } as const;
const mainAxis = { start: "flex-start", center: "center", end: "flex-end", between: "space-between" } as const;
const breakpoints: Record<StackBreakpoint, number> = { compact: tokens.responsive.stackCompact, medium: tokens.responsive.stackMedium, wide: tokens.responsive.stackWide };

/** Props both KjunStack and KjunInline take. Other View props (testID, accessibilityRole, accessibilityLabel, nativeID, onLayout,
 * pointerEvents…) pass through. */
interface FlexProps extends Omit<ViewProps, "style" | "children"> {
  /** Lay the children out as a column or a row; an object changes it with the width, e.g. { base: "column", medium: "row" }. */
  direction?: DirectionValue;
  /** Inner space from space.inset (sm 12 · md 16 · lg 24) on every side; paddingX and paddingY replace one axis. Takes an object per width like gap. */
  padding?: PaddingValue;
  paddingX?: PaddingValue;
  paddingY?: PaddingValue;
  /** A divider between children: true or "full" a hairline, "inset" a hairline that starts after dividerInset, "strong" a band
   * for sections. A hairline sits inside the gap, so the distance between children stays the gap; a band adds its thickness. */
  divider?: StackDivider;
  /** Where an inset divider starts: space.inset (sm 12 · md 16 · lg 24). Default md. */
  dividerInset?: InsetStep;
  /** What the responsive values follow: viewport (default, the window width) or container, the stack's own width from onLayout. */
  responsive?: ResponsiveBasis;
  justify?: StackJustify;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export interface KjunStackProps extends FlexProps {
  /** Space between children: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24) or space.section (sectionSm 32 · sectionMd 48 · sectionLg 64).
   * An object changes it with the width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap?: StackGapValue;
  /** Cross-axis alignment. Buttons, badges and chips keep their own width under stretch (the default), as on Web. */
  align?: StackAlign;
}
export interface KjunInlineProps extends FlexProps {
  /** Space between children: space.inline (xs·sm·md·lg). An object changes it with the width like Stack's gap. */
  gap?: InlineGapValue;
  align?: InlineAlign;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
}
export interface KjunSpacerProps { style?: StyleProp<ViewStyle> }
/** Takes the spare length of a Stack or Inline, pushing what follows to the far end: a menu at the top and a profile at the bottom. */
export function KjunSpacer({ style }: KjunSpacerProps) {
  return <View aria-hidden={true} style={[{ flexGrow: 1, flexShrink: 1, minWidth: 0, minHeight: 0, alignSelf: "stretch" }, style]} />;
}
const isSpacer = (child: ReactNode) => isValidElement(child) && child.type === KjunSpacer;

function Flex({ kind, gap, align, wrap, direction, padding, paddingX, paddingY, divider, dividerInset = "md", responsive = "viewport", justify = "start",
  style, children, onLayout, ...rest }: FlexProps & { kind: "stack" | "inline"; gap?: StackGapValue | InlineGapValue; align?: StackAlign | InlineAlign; wrap?: boolean }) {
  const { colors } = useKjunStyles(), window = useWindowDimensions();
  const container = responsive === "container" && isResponsive(gap, direction, padding, paddingX, paddingY);
  const [measured, setMeasured] = useState<number>();
  const width = container ? measured ?? 0 : window.width;
  const at = <T,>(value: Responsive<T> | undefined, fallback: T) => stepAt(responsiveSteps(value, fallback), width, breakpoints);
  const stack = kind === "stack";
  const space = stack ? stackGap[stepAt(stackGapSteps(gap as StackGapValue), width, breakpoints)] : inlineGap[at(gap as InlineGapValue, "sm")];
  const row = at<FlexDirection>(direction, stack ? "column" : "row") === "row";
  const all = at<InsetStep>(padding, "none"), px = inset[paddingX == null ? all : at(paddingX, "none")], py = inset[paddingY == null ? all : at(paddingY, "none")];
  const rows = items(children, followed(align));
  const variant = dividerVariant(divider);
  const content = variant ? interleave(rows, isSpacer, index => {
    // A hairline sits inside the gap (the distance stays the gap, or the line when the gap is thinner); a band adds its thickness.
    const strong = variant === "strong", t = strong ? tokens.border.dividerStrongWidth : tokens.border.defaultWidth;
    const m = strong ? -space / 2 : (Math.max(space, t) - 2 * space - t) / 2, start = variant === "inset" ? inset[dividerInset] : 0;
    return <View key={"kjun-divider-" + index} aria-hidden={true} style={[{ alignSelf: "stretch", flexShrink: 0, backgroundColor: strong ? colors.background : colors.divider },
      row ? { width: t, marginHorizontal: m, marginTop: start } : { height: t, marginVertical: m, marginStart: start }]} />;
  }) : rows;
  return <View {...rest} onLayout={container ? (event: LayoutChangeEvent) => { setMeasured(event.nativeEvent.layout.width); onLayout?.(event); } : onLayout}
    style={[{ flexDirection: row ? "row" : "column", flexWrap: !stack && wrap ? "wrap" : "nowrap", alignItems: crossAxis[align ?? (stack ? "stretch" : "center")],
      justifyContent: mainAxis[justify], gap: space, paddingHorizontal: px, paddingVertical: py, minWidth: 0 }, style]}>{content}</View>;
}

/** Vertical stack (direction turns it into a row). */
export function KjunStack(props: KjunStackProps) {
  return <Flex {...props} kind="stack" />;
}
/** Horizontal row that wraps by default. */
export function KjunInline({ gap = "sm", wrap = true, ...props }: KjunInlineProps) {
  return <Flex {...props} gap={gap} wrap={wrap} kind="inline" />;
}
