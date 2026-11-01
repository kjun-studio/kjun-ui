import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens, type ButtonSize } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Collapse } from "./collapse";
import { useAccordionState } from "../../../shared/package-runtime/navigation";
import { useMotionValue } from "./motion";
import { useButtonGroupMotion } from "./button-group-motion";
import {
Children, Fragment, createContext,
useContext,
useEffect,
useId,
useRef,
useState,
type ReactElement,
type ReactNode,
} from "react";
import { Animated,ScrollView,View,useWindowDimensions,Platform,type TextStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { KjunButton,KjunIcon } from "./button";
import { KText,content } from "./internal";
import { useKjunStyles } from "./provider";
import { KjunSelect } from "./select";
export { KjunTabs, KjunTabPane, type TabItem, type KjunTabsProps, type KjunTabPaneProps } from "./tabs";
const AccordionContext = createContext<{
  opened: Set<string>;
  toggle: (id: string) => void;
  register: (id: string, defaultOpen: boolean) => () => void;
} | null>(null);
export interface KjunAccordionProps {
  multiple?: boolean;
  tone?: "card" | "muted";
  /** Draws a line between items from the text start, like ListSection (default false: rows are set apart by height alone). */
  divider?: boolean;
  /** Gives every item its own rounded surface with a gap between them; divider has no effect then. */
  separated?: boolean;
  children: ReactNode;
}
// The container tells each item how it is laid out, like ListSection tells its rows (no line after the last).
const AccordionLayoutContext = createContext({ divider: false, separated: false, background: undefined as string | undefined });
export function KjunAccordion({
  multiple = false,
  tone = "card",
  divider = false,
  separated = false,
  children,
}: KjunAccordionProps) {
  const { colors } = useKjunStyles(),
    state = useAccordionState(multiple);
  const background = (tone === "muted" ? colors.secondary : colors.surface) as string;
  const items = Children.toArray(children);
  return (
    <AccordionContext.Provider
      value={state}
    >
      <View
        style={separated ? { gap: tokens.extensions.accordion.itemGap } : {
          borderRadius: tokens.extensions.accordion.radius,
          overflow: "hidden",
          backgroundColor: background,
        }}
      >
        {items.map((item, i) => (
          <AccordionLayoutContext.Provider key={i} value={{ divider: divider && !separated && i < items.length - 1, separated, background: separated ? background : undefined }}>
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
  /** Keeps the body mounted after it first opens, so inputs keep their state while closed. */
  keepMounted?: boolean;
  disabled?: boolean;
  header?: ReactNode;
  children: ReactNode;
}
export function KjunAccordionItem({
  title = "",
  description,
  icon,
  defaultOpen = false,
  disabled = false,
  header,
  open: openProp,
  onOpenChange,
  keepMounted = false,
  children,
}: KjunAccordionItemProps) {
  const controlled = openProp !== undefined,
    context = useContext(AccordionContext),
    { colors } = useKjunStyles(),
    group = controlled ? null : context,
    id = "kjun-" + useId(),
    [own, setOwn] = useState(defaultOpen),
    open = controlled ? openProp : group ? group.opened.has(id) : own;
  // Uncontrolled items report each real change, including a sibling closing them. A defaultOpen item in an
  // Accordion opens once it registers after mount; that is its starting state, not a change.
  const reported = useRef(open), notify = useRef(onOpenChange), registering = useRef(!!group && defaultOpen);
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
    return group?.register(id, defaultOpen);
  }, []);
  return (
    // Hover and press paint the whole item, header and open body together, like Web.
    <View style={{ backgroundColor: !disabled && (pressed || hovered) ? colors.hover : layout.background,
      ...(layout.separated ? { borderRadius: geometry.radius, overflow: "hidden" as const } : {}) }}>
      <Pressable
        nativeID={id + "-heading"}
        accessibilityRole="button"
        // The accordion clips its items to rounded corners; an inset ring with the same radius stays whole.
        focusRingInset
        focusRingRadius={tokens.extensions.accordion.radius}
        accessibilityLabel={description ? title + ", " + description : title}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => { registering.current = false; controlled ? onOpenChange?.(!open) : group ? group.toggle(id) : setOwn(!own); }}
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
        <Animated.View style={{ flexShrink: 0, transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <KjunIcon name="chevron-down" size={geometry.iconSize} color={colors.textTertiary} />
        </Animated.View>
      </Pressable>
      <Collapse open={open} keepMounted={keepMounted}>
        <View
          nativeID={id + "-panel"}
          style={{ paddingLeft: inset, paddingRight: geometry.paddingX, paddingBottom: geometry.contentPaddingBottom }}
        >
          {content(children, { ...typeStyle("body"), ...wrapping, color: colors.text })}
        </View>
      </Collapse>
      {layout.divider && <View pointerEvents="none" style={{ position: "absolute", left: inset, right: 0, bottom: 0, height: tokens.border.defaultWidth, backgroundColor: colors.divider }} />}
    </View>
  );
}
export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
}
export interface KjunBreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  onNavigate?: (item: BreadcrumbItem) => void;
  ariaLabel?: string;
}
export function KjunBreadcrumb({
  items,
  renderLink,
  onNavigate,
  ariaLabel,
}: KjunBreadcrumbProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.breadcrumb;
  const { colors } = useKjunStyles();
  return (
    <View
      accessibilityLabel={ariaLabel}
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: tokens.dimension.value8,
      }}
    >
      {items.map((item, i) => {
        // A last item with `to` is a link too, so only a last item without one reads as the current page.
        const current = i === items.length - 1 && !item.to;
        const label = (
          <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4 }}>
            {!!item.icon && (
              <KjunIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} color={colors.textSecondary} />
            )}
            <KText
              style={{
                color: current ? colors.text : colors.textSecondary,
                fontWeight: current ? typeStyle('label').fontWeight : typeStyle('body').fontWeight,
              }}
            >
              {item.label}
            </KText>
          </View>
        );
        return (
          <Fragment key={i}>
            {i > 0 && (
              <KjunIcon
                name="chevron-right"
                size={tokens.extensions.breadcrumb.separatorSize}
                color={colors.textTertiary}
              />
            )}
            {item.to
              ? renderLink?.(item, label) || (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => onNavigate?.(item)}
                    style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}
                  >
                    {label}
                  </Pressable>
                )
              : label}
          </Fragment>
        );
      })}
    </View>
  );
}
export interface KjunPaginationProps {
  currentPage?: number;
  page?: number;
  totalPages: number;
  totalRows?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  siblingCount?: number;
  showInfo?: boolean;
  showSizeSelector?: boolean;
  showFirstLast?: boolean;
  formatter?: (value: number) => string;
  onPageChange?: (page: number) => void;
  onChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}
export function KjunPagination({
  currentPage,
  page,
  totalPages,
  totalRows = 0,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
  showInfo = false,
  showSizeSelector = false,
  showFirstLast = true,
  formatter = String,
  onPageChange,
  onChange,
  onPageSizeChange,
}: KjunPaginationProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    window = useWindowDimensions(),
    current = Math.max(1, Math.min(totalPages, currentPage ?? page ?? 1));
  if (totalPages <= 1 && !showSizeSelector && !(showInfo && totalRows > 0)) return null;
  const compact = window.width < tokens.responsive.pagination;
  const change = (v: number) => {
    if (v < 1 || v > totalPages || v === current) return;
    onPageChange?.(v);
    onChange?.(v);
  };
  const visible = new Set([
    1,
    totalPages,
    ...Array.from(
      { length: Math.min(totalPages, siblingCount * 2 + 1) },
      (_, i) => current - siblingCount + i
    ).filter((v) => v >= 1 && v <= totalPages),
  ]);
  const pages = [...visible]
    .sort((a, b) => a - b)
    .flatMap((v, i, all) => (i && v - all[i - 1] > 1 ? ["...", v] : [v]));
  const pageButtonStyle = {
    width: Math.max(tokens.extensions.pagination.itemSize, tokens.native.minimumTouchTarget),
    height: Math.max(tokens.extensions.pagination.itemSize, tokens.native.minimumTouchTarget),
    borderRadius: tokens.extensions.pagination.radius,
    paddingHorizontal: 0,
  };
  // Arrows are icon-only buttons; take the button size whose icon matches the pagination icon role.
  const arrowSize = (Object.keys(tokens.button.iconSizes) as ButtonSize[])
    .find(size => tokens.button.iconSizes[size] === tokens.extensions.pagination.iconSize) ?? "sm";
  const button = (target: number, label: string, icon: string) => (
    <KjunButton
      style={pageButtonStyle}
      size={arrowSize}
      variant="ghost"
      ariaLabel={label}
      disabled={target < 1 || target > totalPages || target === current}
      // An icon-only button centers the chevron and paints it with the ghost ink, like the page numbers and Web.
      prefixIcon={icon}
      onPress={() => change(target)}
    />
  );
  return (
    <View
      accessibilityLabel={m.pagination}
      style={{
        flexDirection: compact ? "column" : "row",
        alignItems: compact ? "stretch" : "center",
        justifyContent: "space-between",
        gap: tokens.extensions.pagination.gap,
        padding: tokens.extensions.pagination.padding,
        borderTopWidth: tokens.border.defaultWidth,
        borderTopColor: colors.border,
      }}
    >
      {showInfo && totalRows > 0 ? (
        <KText style={{ color: colors.textSecondary }}>
          {m.pageRange((current - 1) * pageSize + 1, Math.min(current * pageSize, totalRows), formatter(totalRows))}
        </KText>
      ) : (
        <View />
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.extensions.pagination.itemGap,
          flexWrap: "wrap",
        }}
      >
        {showSizeSelector && (
          <View style={{ minWidth: tokens.extensions.pagination.selectorMinimumWidth }}><KjunSelect
            size="sm"
            ariaLabel={m.itemsPerPage}
            value={pageSize}
            options={pageSizeOptions.map((n) => ({
              value: n,
              label: m.perPage(n),
            }))}
            onValueChange={(v) => {
              onPageSizeChange?.(Number(v));
              onPageChange?.(1);
              onChange?.(1);
            }}
          /></View>
        )}
        {totalPages > 1 && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.pagination.itemGap, marginLeft: compact ? "auto" : undefined }}>
        {!compact && showFirstLast && button(1, m.firstPage, "chevrons-left")}
        {button(current - 1, m.previousPage, "chevron-left")}
        {compact ? (
          <KText style={{ paddingHorizontal: tokens.extensions.pagination.labelPaddingX, color: colors.text, fontVariant: ["tabular-nums"] }}>
            <KText style={{ fontWeight: typeStyle('control').fontWeight }}>{current}</KText> / {totalPages}
          </KText>
        ) : (
          pages.map((n, i) =>
            typeof n === "string" ? (
              <KText key={"dots" + i}>...</KText>
            ) : (
              <KjunButton
                key={n}
                style={pageButtonStyle}
                size="sm"
                variant={current === n ? "primary" : "ghost"}
                ariaLabel={m.page(n)}
                onPress={() => change(n)}
              >
                {n}
              </KjunButton>
            )
          )
        )}
        {button(current + 1, m.nextPage, "chevron-right")}
        {!compact &&
          showFirstLast &&
          button(totalPages, m.lastPage, "chevrons-right")}
        </View>}
      </View>
    </View>
  );
}
