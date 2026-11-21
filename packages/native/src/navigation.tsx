import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Collapse } from "./collapse";
import { useAccordionState } from "../../../shared/package-runtime/navigation";
import { accordionKeyTarget } from "../../../shared/package-runtime/accordion-state";
import { hasContent } from "../../../shared/package-runtime/content-presence";
import { breadcrumbCurrent, collapseBreadcrumb, type BreadcrumbItem } from "../../../shared/package-runtime/breadcrumb";
import { KjunDropdown, KjunDropdownItem } from "./dropdown";
import { useMotionValue } from "./motion";
import { useButtonGroupMotion } from "./button-group-motion";
import {
Children, Fragment, createContext, isValidElement,
useContext,
useEffect,
useId,
useRef,
useState,
type ReactElement,
type ReactNode,
} from "react";
import { Animated,ScrollView,View,Platform,type StyleProp,type TextStyle,type ViewStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton,KjunIcon } from "./button";
import { KText,content } from "./internal";
import { useKjunStyles } from "./provider";
export { KjunTabs, KjunTabPane, type TabItem, type KjunTabsProps, type KjunTabPaneProps } from "./tabs";
export { KjunPagination, type KjunPaginationProps, type KjunPaginationLayout } from "./pagination";
const AccordionContext = createContext<{
  opened: ReadonlySet<string>;
  controlled: boolean;
  toggle: (id: string) => void;
  register: (id: string, defaultOpen: boolean) => () => void;
} | null>(null);
export interface KjunAccordionProps {
  multiple?: boolean;
  /** The group's fill (default muted: an in-flow panel set apart by its fill, not an outline; card sits it on the card colour). */
  tone?: "card" | "muted";
  /** Draws a line between items from the text start, like ListSection (default true; false sets rows apart by height alone). */
  divider?: boolean;
  /** Gives every item its own rounded surface with a gap between them; divider has no effect then. */
  separated?: boolean;
  /** The heading level wrapping each header on the web (default 3), or false for none, so headers join the page's outline.
   * On a device a header is one button, which cannot also be a heading. */
  headingLevel?: AccordionHeadingLevel;
  /** Open panels are labelled regions on the web (default true). Turn off for long lists, where many landmarks crowd a screen reader. */
  region?: boolean;
  /** Controlled open items, by each item's value (give the items a value). A single-open Accordion shows the last one. */
  value?: string[];
  /** The items open at first, by value, when value is not given. */
  defaultValue?: string[];
  /** Requests a change when controlled; reports every change otherwise. Items without a value report an internal id. */
  onValueChange?: (value: string[]) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}
export type AccordionHeadingLevel = 2 | 3 | 4 | 5 | 6 | false;
// The container tells each item how it is laid out, like ListSection tells its rows (no line after the last).
const AccordionLayoutContext = createContext({ divider: false, separated: false, background: undefined as string | undefined, headingLevel: 3 as AccordionHeadingLevel, region: true });
/** Children with fragments opened, so an item inside a fragment still knows whether it is the last. */
const flatten = (children: ReactNode): ReactNode[] => Children.toArray(children).flatMap(child =>
  isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child]);
export function KjunAccordion({
  multiple = false,
  tone = "muted",
  divider = true,
  separated = false,
  headingLevel = 3,
  region = true,
  value,
  defaultValue,
  onValueChange,
  style,
  testID,
  children,
}: KjunAccordionProps) {
  const { colors } = useKjunStyles(),
    state = useAccordionState(multiple, { value, defaultValue, onValueChange });
  const background = (tone === "muted" ? colors.secondary : colors.surface) as string;
  const items = flatten(children);
  const root = useRef<View>(null);
  // On the web ↑↓ Home End move between this Accordion's headers, as in the WAI-ARIA accordion pattern (Web does the same).
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = root.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const keydown = (event: KeyboardEvent) => {
      const triggers = Array.from(node.querySelectorAll<HTMLElement>("[data-kjun-accordion-trigger]"))
        .filter(trigger => trigger.closest("[data-kjun-accordion]") === node && trigger.getAttribute("aria-disabled") !== "true");
      const next = accordionKeyTarget(event.key, triggers.indexOf(event.target as HTMLElement), triggers.length);
      if (next === null) return;
      event.preventDefault();
      triggers[next].focus();
    };
    node.addEventListener("keydown", keydown);
    return () => node.removeEventListener("keydown", keydown);
  }, []);
  return (
    <AccordionContext.Provider
      value={state}
    >
      <View
        ref={root}
        testID={testID}
        {...(Platform.OS === "web" ? { dataSet: { kjunAccordion: "" } } : {})}
        style={[separated ? { gap: tokens.extensions.accordion.itemGap } : {
          borderRadius: tokens.extensions.accordion.radius,
          overflow: "hidden",
          backgroundColor: background,
        }, style]}
      >
        {items.map((item, i) => (
          <AccordionLayoutContext.Provider key={i} value={{ divider: divider && !separated && i < items.length - 1, separated, background: separated ? background : undefined, headingLevel, region }}>
            {item}
          </AccordionLayoutContext.Provider>
        ))}
      </View>
    </AccordionContext.Provider>
  );
}
export interface KjunAccordionItemProps {
  title?: string;
  /** A secondary line under the title (caption, secondary text). */
  description?: string;
  /** Icon name drawn in a 40px leading column at the list icon size; the body and divider then start at the title. */
  icon?: string;
  defaultOpen?: boolean;
  /** Controlled open state. A controlled item follows this value only and stays out of the Accordion's single-open rule. */
  open?: boolean;
  /** Requests a change on a controlled item; reports every change on an uncontrolled one (also when a sibling closes it). */
  onOpenChange?: (open: boolean) => void;
  /** Called once the item has finished opening, after its height motion: the panel has its full height (e.g. to scroll a result into view). */
  onAfterOpen?: () => void;
  /** Called once the item has finished closing. */
  onAfterClose?: () => void;
  /** Keeps the body mounted after it first opens, so inputs keep their state while closed. */
  keepMounted?: boolean;
  disabled?: boolean;
  /** Replaces the title in the header; pass ariaLabel when it is not plain text. */
  header?: ReactNode;
  /** The header's accessible name when header is not plain text. */
  ariaLabel?: string;
  /** Names the item in the Accordion's value, defaultValue and onValueChange. */
  value?: string;
  /** Information at the end of the header, before the chevron, such as a status badge, an amount or a count.
   * It is part of the header button, so no buttons or links. */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}
export function KjunAccordionItem({
  title = "",
  description,
  icon,
  defaultOpen = false,
  disabled = false,
  header,
  ariaLabel,
  open: openProp,
  onOpenChange,
  onAfterOpen,
  onAfterClose,
  keepMounted = false,
  value,
  trailing,
  style,
  testID,
  children,
}: KjunAccordionItemProps) {
  const controlled = openProp !== undefined,
    context = useContext(AccordionContext),
    { colors } = useKjunStyles(),
    group = controlled ? null : context,
    id = "kjun-" + useId(),
    // The group knows the item by its value, or by its own id without one.
    key = value ?? id,
    [own, setOwn] = useState(defaultOpen),
    open = controlled ? openProp : group ? group.opened.has(key) : own;
  // Uncontrolled items report each real change, including a sibling closing them. A defaultOpen item in an
  // Accordion opens once it registers after mount; that is its starting state, not a change.
  const reported = useRef(open), notify = useRef(onOpenChange), registering = useRef(!!group && !group.controlled && defaultOpen);
  notify.current = onOpenChange;
  useEffect(() => {
    if (registering.current) { if (open) { registering.current = false; reported.current = open; } return; }
    if (controlled || reported.current === open) return;
    reported.current = open;
    notify.current?.(open);
  }, [open, controlled]);
  const rotation = useMotionValue(open ? 1 : 0, tokens.motion.collapse, undefined, undefined, true);
  const geometry = tokens.extensions.accordion;
  const [hovered, setHovered] = useState(false), [pressed, setPressed] = useState(false);
  const layout = useContext(AccordionLayoutContext);
  // With an icon the body and the divider start at the title, past the leading column.
  const inset = geometry.paddingX + (icon ? geometry.leadingWidth + geometry.headerGap : 0);
  const wrapping = Platform.OS === 'web' ? { wordBreak: 'keep-all', overflowWrap: 'anywhere' } as TextStyle : {};
  useEffect(() => {
    return group?.register(key, defaultOpen);
  }, []);
  const plainTrailing = typeof trailing === "string" || typeof trailing === "number" ? String(trailing) : "";
  const web = Platform.OS === "web";
  // On the web the header button sits in a heading of the Accordion's level, as on Web; a device has no heading inside a button.
  const heading = (node: ReactNode) => web && layout.headingLevel
    ? <View role="heading" aria-level={layout.headingLevel}>{node}</View> : node;
  return (
    // Hover and press paint the whole item, header and open body together, like Web.
    <View testID={testID} style={[{ backgroundColor: !disabled && (pressed || hovered) ? colors.hover : layout.background,
      ...(layout.separated ? { borderRadius: geometry.radius, overflow: "hidden" as const } : {}) }, style]}>
      {heading(<Pressable
        {...(web ? { dataSet: { kjunAccordionTrigger: "" } } : {})}
        nativeID={id + "-heading"}
        accessibilityRole="button"
        // The accordion clips its items to rounded corners; an inset ring with the same radius stays whole.
        focusRingInset
        focusRingRadius={tokens.extensions.accordion.radius}
        // A custom header is read as rendered unless ariaLabel names it; the title stands in only without one.
        accessibilityLabel={ariaLabel ?? (header ? undefined : [title, description, plainTrailing].filter(Boolean).join(", "))}
        {...(Platform.OS === "web" ? { "aria-controls": id + "-panel" } : {})}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => { registering.current = false; controlled ? onOpenChange?.(!open) : group ? group.toggle(key) : setOwn(!own); }}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={{
          minHeight: geometry.minimumHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: geometry.headerGap,
          paddingVertical: geometry.headerPaddingY,
          paddingHorizontal: geometry.paddingX,
          opacity: disabled ? tokens.states.opacity.disabled : 1,
        }}
      >
        {!!icon && <View style={{ minWidth: geometry.leadingWidth, alignItems: "center", justifyContent: "center" }}>
          <KjunIcon name={icon} size={geometry.leadingIconSize} color={colors.textSecondary} />
        </View>}
        <View style={{ flex: 1, minWidth: 0 }}>
          {content(header || title, { ...typeStyle("control"), ...wrapping })}
          {!!description && <KText style={{ ...typeStyle("caption"), ...wrapping, marginTop: geometry.descriptionGap, color: colors.textSecondary }}>{description}</KText>}
        </View>
        {hasContent(trailing) && <View style={{ flexShrink: 0, maxWidth: `${geometry.trailingMaxPercent}%`, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
          {content(trailing, { ...typeStyle("label"), ...wrapping, color: colors.textSecondary, textAlign: "right" })}
        </View>}
        <Animated.View style={{ flexShrink: 0, transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <KjunIcon name="chevron-down" size={geometry.iconSize} color={colors.textTertiary} />
        </Animated.View>
      </Pressable>)}
      <Collapse open={open} keepMounted={keepMounted} onSettled={settled => (settled ? onAfterOpen : onAfterClose)?.()}>
        <View
          nativeID={id + "-panel"}
          // On Native Web the open body is a region named by its header, as on Web.
          {...(web && layout.region ? { role: "region" as const, "aria-labelledby": id + "-heading" } : {})}
          style={{ paddingLeft: inset, paddingRight: geometry.paddingX, paddingBottom: geometry.contentPaddingBottom }}
        >
          {content(children, { ...typeStyle("body"), ...wrapping, color: colors.text })}
        </View>
      </Collapse>
      {layout.divider && <View style={{ pointerEvents: "none", position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
    </View>
  );
}
export type { BreadcrumbItem };
export interface KjunBreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  onNavigate?: (item: BreadcrumbItem) => void;
  ariaLabel?: string;
  /** Folds a long trail: the first step and the last maxItems - 1 stay, and the steps between open from a "…" menu. */
  maxItems?: number;
}
export function KjunBreadcrumb({
  items,
  renderLink,
  onNavigate,
  ariaLabel,
  maxItems,
}: KjunBreadcrumbProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.breadcrumb;
  const { colors } = useKjunStyles();
  const geometry = tokens.extensions.breadcrumb;
  if (!items.length) return null;
  const { shown, hidden, at } = collapseBreadcrumb(items, maxItems);
  const separator = <KjunIcon name="chevron-right" size={geometry.separatorSize} color={colors.textTertiary} />;
  const linkSlop = Math.max(0, (tokens.native.minimumTouchTarget - tokens.typography.body.lineHeightPx) / 2);
  return (
    <View
      accessibilityLabel={ariaLabel}
      // Native Web reads the trail as navigation, as on Web.
      {...(Platform.OS === "web" ? { role: "navigation" as const } : {})}
      style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: geometry.gap }}
    >
      {shown.map(({ item, index }, position) => {
        const current = breadcrumbCurrent(item, index, items.length);
        // A link under the pointer or the finger takes the brand colour and an underline, like Web's hover.
        const label = (active = false) => (
          <View style={{ flexDirection: "row", alignItems: "center", gap: geometry.iconGap, maxWidth: geometry.labelMaxWidth }}
            {...(Platform.OS === "web" && current ? { "aria-current": "page" } : {})}>
            {!!item.icon && <KjunIcon name={item.icon} size={geometry.iconSize} color={active ? colors.brand : colors.textSecondary} />}
            <KText numberOfLines={1} style={{ flexShrink: 1, color: active ? colors.brand : current ? colors.text : colors.textSecondary,
              textDecorationLine: active ? "underline" : "none",
              fontWeight: current ? typeStyle('label').fontWeight : typeStyle('body').fontWeight }}>{item.label}</KText>
          </View>
        );
        return (
          <Fragment key={index}>
            {position === at ? (
              <>
                {separator}
                <KjunDropdown trigger={<KjunButton size="xs" variant="ghost" prefixIcon="dots" ariaLabel={m.showPath} />}>
                  {hidden.map(({ item: folded, index: key }) => <KjunDropdownItem key={key} icon={folded.icon} onPress={() => onNavigate?.(folded)}>{folded.label}</KjunDropdownItem>)}
                </KjunDropdown>
              </>
            ) : null}
            {position > 0 ? separator : null}
            {item.to
              ? renderLink?.(item, label()) || (
                  // The row keeps Web's text height; the touch area reaches 44px with hitSlop instead of growing the row.
                  <Pressable accessibilityRole="link" onPress={() => onNavigate?.(item)} hitSlop={{ top: linkSlop, bottom: linkSlop }}
                    style={{ justifyContent: "center" }}>
                    {({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => label(pressed || !!hovered)}
                  </Pressable>
                )
              : label()}
          </Fragment>
        );
      })}
    </View>
  );
}
