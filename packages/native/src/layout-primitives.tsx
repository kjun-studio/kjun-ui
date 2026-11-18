import { Children, Fragment, cloneElement, isValidElement, useState, type ComponentType, type ReactElement, type ReactNode } from "react";
import { View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type TextProps, type TextStyle, type ViewProps, type ViewStyle } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import {
  clampLines, crossAxisCss, dividerVariant, interleave, isNumericVariant, isResponsive, mainAxisCss, responsiveSteps, stackGapSteps, stepAt, titleVariants,
  type DirectionValue, type FlexDirection, type InlineAlign, type InlineAlignValue, type InlineGap, type InlineGapValue, type InlineJustify, type InlineRowGap,
  type InlineRowGapValue, type InsetStep, type JustifyValue, type LegacyStackGap, type PaddingValue, type Responsive, type ResponsiveBasis, type StackAlign,
  type StackAlignValue, type StackBreakpoint, type StackDivider, type StackGap, type StackGapValue, type StackJustify, type TextAlign, type TextDecoration,
  type TextTone, type TextVariant,
} from "../../../shared/package-runtime/layout-primitives";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { KjunFormGroup } from "./input";
import { KjunButton, KjunIcon } from "./button";
import { AccessiblePressable } from "./a11y";
import { KjunBadge, KjunSpinner } from "./display-primitives";
import { KjunChip } from "./chip";
import { KjunCopyButton, KjunExternalLink } from "./actions";
import { KjunFilterGroup } from "./selection-groups";
import { KjunDeviation } from "./financial-display";
import { KjunAnimatedNumber, KjunPriceCell, KjunSignedValue } from "./number-display";
import { FontText, KText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";
export type { DirectionValue, FlexDirection, InlineAlign, InlineAlignValue, InlineGap, InlineGapValue, InlineJustify, InlineRowGap, InlineRowGapValue, InsetStep,
  JustifyValue, LegacyStackGap, PaddingValue, Responsive, ResponsiveBasis, StackAlign, StackAlignValue, StackBreakpoint, StackDivider, StackGap, StackGapValue,
  StackJustify, TextAlign, TextDecoration, TextTone, TextVariant };

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
  /** With maxLines, a "더보기" button under the text opens the rest and turns into "접기". It shows only while the text
   * overflows (or is open), measured with a hidden full copy. The text and the button sit in a View. */
  expandable?: boolean;
  /** Whether the expandable text is open; leave it out to let the text keep it. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}
const toneRole = { default: "text", secondary: "textSecondary", tertiary: "textTertiary", disabled: "textDisabled",
  brand: "brand", danger: "danger", success: "success", warning: "warning", info: "info",
  inverse: "onBrand", onBrand: "onBrand", onDanger: "onDanger", onSuccess: "onSuccess", onWarning: "onWarning" } as const;
const textAlign = { start: "left", center: "center", end: "right" } as const;
export function KjunText({ variant = "body", tone = "default", align, maxLines, numeric, decoration, expandable, expanded: given, onExpandedChange,
  style, children, ...rest }: KjunTextProps) {
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  const m = useKjunMessages();
  const lines = clampLines(maxLines);
  const [own, setOwn] = useState(false);
  const [heights, setHeights] = useState<{ shown?: number; full?: number }>({});
  const toggle = !!(expandable && lines), open = toggle && (given ?? own);
  const clamped = open ? undefined : lines;
  const inherit = variant === "inherit";
  // A nested Text inherits its parent's type on Native, so inherit sets no size and, at the default tone, no color.
  const Root = inherit ? FontText : KText;
  const textStyle = [
    inherit ? null : typeStyle(variant),
    inherit && tone === "default" ? null : { color: colors[toneRole[tone]] },
    isNumericVariant(variant) ? { fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"] } : null,
    numeric ? { fontVariant: ["tabular-nums"] } : null,
    decoration === "lineThrough" ? { textDecorationLine: "line-through" } : null,
    align ? { textAlign: textAlign[align] } : null,
    style,
  ] as StyleProp<TextStyle>;
  // An explicit undefined (cond ? "link" : undefined) keeps the heading role of title variants.
  const role = rest.accessibilityRole ?? (titleVariants.includes(variant) ? "header" : undefined);
  if (!toggle) return <Root {...rest} accessibilityRole={role} numberOfLines={lines} ellipsizeMode={lines ? "tail" : undefined} style={textStyle}>{children}</Root>;
  const measure = (key: "shown" | "full") => (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    setHeights(current => current[key] === height ? current : { ...current, [key]: height });
  };
  const overflows = heights.full != null && heights.shown != null && heights.full > heights.shown + 0.5;
  const change = (next: boolean) => { if (given === undefined) setOwn(next); onExpandedChange?.(next); };
  return (
    <View style={{ gap: tokens.space.stack.xs }}>
      <Root {...rest} accessibilityRole={role} numberOfLines={clamped} ellipsizeMode={clamped ? "tail" : undefined} style={textStyle}
        onLayout={(event: LayoutChangeEvent) => { measure("shown")(event); rest.onLayout?.(event); }}>{children}</Root>
      {/* The full text at the same width, invisible, tells whether the clamp hides lines. */}
      {!open && <View pointerEvents="none" aria-hidden={true} importantForAccessibility="no-hide-descendants" style={{ position: "absolute", top: 0, left: 0, right: 0, opacity: 0 }}>
        <Root style={textStyle} onLayout={measure("full")}>{children}</Root>
      </View>}
      {(open || overflows) && <AccessiblePressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => change(!open)}
        style={({ pressed }: { pressed: boolean }) => ({ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: tokens.space.inline.xs,
          opacity: pressed ? tokens.states.opacity.pressed : 1 })}>
        {/* A quiet text button in the label role (text-secondary, 500): a step below the text it opens, not a link. */}
        <KText style={[typeStyle("label"), { color: colors.textSecondary }]}>{open ? m.showLessText : m.showMoreText}</KText>
        <KjunIcon name={open ? "chevron-up" : "chevron-down"} size={tokens.button.iconSizes.sm} color={colors.textSecondary} />
      </AccessiblePressable>}
    </View>
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
// Content-width controls sit at flex-start on their own (Web: the `[data-kjun-stack] > .kjun-button…` rule). A direct one
// takes the stack's alignment as alignSelf: flex-start under stretch, the alignment otherwise (Inline's default center too),
// and the child's own style.alignSelf still wins. Controls that take a style get it there; the others get a wrapping View.
type ChildAlign = "flex-start" | "center" | "flex-end" | "baseline";
const styled = new Set<unknown>([KjunButton, KjunBadge, KjunChip, KjunAnimatedNumber]);
const wrapped = new Set<unknown>([KjunCopyButton, KjunExternalLink, KjunSpinner, KjunFilterGroup, KjunDeviation, KjunSignedValue, KjunPriceCell]);
function items(children: ReactNode, childAlign: ChildAlign) {
  return flatten(children).map(([key, child]) => {
    if (typeof child === "string" || typeof child === "number") return <KText key={key}>{child}</KText>;
    if (!isValidElement(child)) return child;
    if (child.type === KjunFormGroup) {
      const group = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(group, { key, style: [{ marginBottom: 0 }, group.props.style] });
    }
    if (styled.has(child.type) && !(child.props as { block?: boolean }).block) {
      const control = child as ReactElement<{ style?: StyleProp<ViewStyle> }>;
      return cloneElement(control, { key, style: [{ alignSelf: childAlign }, control.props.style] });
    }
    // Always wrapped, whatever the alignment, so a change of alignment keeps the control's state.
    if (wrapped.has(child.type)) return <View key={key} style={{ alignSelf: childAlign, maxWidth: "100%" }}>{cloneElement(child)}</View>;
    return cloneElement(child, { key });
  });
}
const followed = (align: StackAlign | InlineAlign): ChildAlign => align === "stretch" ? "flex-start" : crossAxisCss[align];

const stackGap: Record<StackGap, number> = {
  none: 0, xs: tokens.space.stack.xs, sm: tokens.space.stack.sm, smMd: tokens.space.stack.smMd, md: tokens.space.stack.md, lg: tokens.space.stack.lg,
  sectionSm: tokens.space.section.sm, sectionMd: tokens.space.section.md, sectionLg: tokens.space.section.lg,
};
const inlineGap: Record<InlineGap, number> = {
  none: 0, xs: tokens.space.inline.xs, sm: tokens.space.inline.sm, md: tokens.space.inline.md, lg: tokens.space.inline.lg,
};
const inset: Record<InsetStep, number> = { none: 0, sm: tokens.space.inset.sm, md: tokens.space.inset.md, lg: tokens.space.inset.lg };
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
  /** Main-axis distribution; takes an object per width like gap. */
  justify?: JustifyValue;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}
export interface KjunStackProps extends FlexProps {
  /** Space between children: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24) or space.section (sectionSm 32 · sectionMd 48 · sectionLg 64).
   * An object changes it with the width, e.g. { base: "sm", medium: "lg" } (compact 640, medium 768, wide 1024 and up). */
  gap?: StackGapValue;
  /** Cross-axis alignment. Buttons, badges, chips and other content-width controls keep their own width under stretch (the default),
   * as on Web. An object changes it with the width. */
  align?: StackAlignValue;
}
export interface KjunInlineProps extends FlexProps {
  /** Space between children: space.inline (xs·sm·md·lg). An object changes it with the width like Stack's gap. */
  gap?: InlineGapValue;
  /** The space between wrapped lines: space.stack (xs 4 · sm 8 · smMd 12 · md 16 · lg 24); absent, the lines keep the gap. Takes an object per width. */
  rowGap?: InlineRowGapValue;
  /** Cross-axis alignment; an object changes it with the width. */
  align?: InlineAlignValue;
  /** Wrap onto new lines when the row runs out of width. Default true. */
  wrap?: boolean;
}
export interface KjunSpacerProps { style?: StyleProp<ViewStyle> }
/** Takes the spare length of a Stack or Inline, pushing what follows to the far end: a menu at the top and a profile at the bottom. */
export function KjunSpacer({ style }: KjunSpacerProps) {
  return <View aria-hidden={true} style={[{ flexGrow: 1, flexShrink: 1, minWidth: 0, minHeight: 0, alignSelf: "stretch" }, style]} />;
}
const isSpacer = (child: ReactNode) => isValidElement(child) && child.type === KjunSpacer;

function Flex({ kind, gap, align, rowGap, wrap, direction, padding, paddingX, paddingY, divider, dividerInset = "md", responsive = "viewport", justify,
  style, children, onLayout, ...rest }: FlexProps & { kind: "stack" | "inline"; gap?: StackGapValue | InlineGapValue; align?: StackAlignValue | InlineAlignValue;
  rowGap?: InlineRowGapValue; wrap?: boolean }) {
  const { colors } = useKjunStyles(), window = useWindowDimensions();
  const container = responsive === "container" && isResponsive(gap, direction, padding, paddingX, paddingY, align, justify, rowGap);
  const [measured, setMeasured] = useState<number>();
  // Before the first onLayout the container mode draws the base step, as on Web.
  const width = container ? measured ?? 0 : window.width;
  const at = <T,>(value: Responsive<T> | undefined, fallback: T) => stepAt(responsiveSteps(value, fallback), width, breakpoints);
  const stack = kind === "stack";
  const space = stack ? stackGap[stepAt(stackGapSteps(gap as StackGapValue), width, breakpoints)] : inlineGap[at(gap as InlineGapValue, "sm")];
  const row = at<FlexDirection>(direction, stack ? "column" : "row") === "row";
  const all = at<InsetStep>(padding, "none"), px = inset[paddingX == null ? all : at(paddingX, "none")], py = inset[paddingY == null ? all : at(paddingY, "none")];
  const crossAlign = at<StackAlign | InlineAlign>(align, stack ? "stretch" : "center");
  const rowSpace = !stack && rowGap != null ? (() => { const step = at<InlineRowGap | undefined>(rowGap, typeof rowGap === "object" ? rowGap.base : rowGap);
    return step ? stackGap[step] : space; })() : undefined;
  const rows = items(children, followed(crossAlign));
  const variant = dividerVariant(divider);
  const content = variant ? interleave(rows, isSpacer, index => {
    // A hairline sits inside the gap (the distance stays the gap, or the line when the gap is thinner); a band adds its thickness.
    const strong = variant === "strong", t = strong ? tokens.border.dividerStrongWidth : tokens.border.defaultWidth;
    const m = strong ? -space / 2 : (Math.max(space, t) - 2 * space - t) / 2, start = variant === "inset" ? inset[dividerInset] : 0;
    return <View key={"kjun-divider-" + index} aria-hidden={true} style={[{ alignSelf: "stretch", flexShrink: 0, backgroundColor: strong ? colors.background : colors.divider },
      row ? { width: t, marginHorizontal: m, marginTop: start } : { height: t, marginVertical: m, marginStart: start }]} />;
  }) : rows;
  return <View {...rest} onLayout={container ? (event: LayoutChangeEvent) => { setMeasured(event.nativeEvent.layout.width); onLayout?.(event); } : onLayout}
    style={[{ flexDirection: row ? "row" : "column", flexWrap: !stack && wrap ? "wrap" : "nowrap", alignItems: crossAxisCss[crossAlign],
      justifyContent: mainAxisCss[at<StackJustify>(justify, "start")], gap: space, ...(rowSpace != null && row ? { rowGap: rowSpace } : {}),
      paddingHorizontal: px, paddingVertical: py, minWidth: 0 }, style]}>{content}</View>;
}

/** Vertical stack (direction turns it into a row). */
export function KjunStack(props: KjunStackProps) {
  return <Flex {...props} kind="stack" />;
}
/** Horizontal row that wraps by default. */
export function KjunInline({ gap = "sm", wrap = true, ...props }: KjunInlineProps) {
  return <Flex {...props} gap={gap} wrap={wrap} kind="inline" />;
}
