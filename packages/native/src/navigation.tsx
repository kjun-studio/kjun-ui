import { tokens, type ButtonSize } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Collapse } from "./collapse";
import { useAccordionState } from "../../../shared/package-runtime/navigation";
import { useMotionValue } from "./motion";
import { useButtonGroupMotion } from "./button-group-motion";
import {
Fragment, createContext,
useContext,
useEffect,
useId,
useState,
type ReactElement,
type ReactNode,
} from "react";
import { Animated,ScrollView,View,useWindowDimensions,Platform,type TextStyle } from "react-native";
import { AccessiblePressable as Pressable } from "./a11y";
import { DsButton,DsIcon } from "./button";
import { KText,content } from "./internal";
import { useKjunStyles } from "./provider";
import { DsSelect } from "./select";
export { DsTabs, DsTabPane, type TabItem, type DsTabsProps, type DsTabPaneProps } from "./tabs";
const AccordionContext = createContext<{
  opened: Set<string>;
  toggle: (id: string) => void;
  register: (id: string, defaultOpen: boolean) => () => void;
} | null>(null);
export interface DsAccordionProps {
  multiple?: boolean;
  tone?: "card" | "muted";
  children: ReactNode;
}
export function DsAccordion({
  multiple = false,
  tone = "card",
  children,
}: DsAccordionProps) {
  const { colors } = useKjunStyles(),
    state = useAccordionState(multiple);
  return (
    <AccordionContext.Provider
      value={state}
    >
      <View
        style={{
          borderRadius: tokens.extensions.accordion.radius,
          overflow: "hidden",
          backgroundColor: tone === "muted" ? colors.secondary : colors.surface,
        }}
      >
        {children}
      </View>
    </AccordionContext.Provider>
  );
}
export interface DsAccordionItemProps {
  title?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  header?: ReactNode;
  children: ReactNode;
}
export function DsAccordionItem({
  title = "",
  defaultOpen = false,
  disabled = false,
  header,
  children,
}: DsAccordionItemProps) {
  const { colors } = useKjunStyles(),
    group = useContext(AccordionContext),
    id = useId(),
    [own, setOwn] = useState(defaultOpen),
    open = group ? group.opened.has(id) : own;
  const rotation = useMotionValue(open ? 1 : 0, tokens.motion.collapse, undefined, undefined, true);
  const geometry = tokens.extensions.accordion;
  const [hovered, setHovered] = useState(false);
  const wrapping = Platform.OS === 'web' ? { wordBreak: 'keep-all', overflowWrap: 'anywhere' } as TextStyle : {};
  useEffect(() => {
    return group?.register(id, defaultOpen);
  }, []);
  return (
    <View>
      <Pressable
        nativeID={id + "-heading"}
        accessibilityRole="button"
        // The accordion clips its items to rounded corners; an inset ring with the same radius stays whole.
        focusRingInset
        focusRingRadius={tokens.extensions.accordion.radius}
        accessibilityLabel={title}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => (group ? group.toggle(id) : setOwn(!own))}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => ({
          minHeight: geometry.minimumHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: geometry.headerGap,
          paddingVertical: geometry.headerPaddingY,
          paddingHorizontal: geometry.paddingX,
          backgroundColor: !disabled && (pressed || hovered) ? colors.hover : undefined,
          opacity: disabled ? tokens.states.opacity.disabled : 1,
        })}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          {content(header || title, { ...typeStyle("control"), ...wrapping })}
        </View>
        <Animated.View style={{ flexShrink: 0, transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }] }}>
          <DsIcon name="chevron-down" size={geometry.iconSize} color={colors.textSecondary} />
        </Animated.View>
      </Pressable>
      <Collapse open={open}>
        <View
          nativeID={id + "-panel"}
          style={{ paddingHorizontal: geometry.paddingX, paddingBottom: geometry.contentPaddingBottom }}
        >
          {content(children, { ...typeStyle("body"), ...wrapping, color: colors.textSecondary })}
        </View>
      </Collapse>
    </View>
  );
}
export interface BreadcrumbItem {
  label: string;
  to?: string;
  icon?: string;
}
export interface DsBreadcrumbProps {
  items: BreadcrumbItem[];
  renderLink?: (item: BreadcrumbItem, children: ReactNode) => ReactNode;
  onNavigate?: (item: BreadcrumbItem) => void;
  ariaLabel?: string;
}
export function DsBreadcrumb({
  items,
  renderLink,
  onNavigate,
  ariaLabel = "현재 위치",
}: DsBreadcrumbProps) {
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
        const label = (
          <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4 }}>
            {item.icon && (
              <DsIcon name={item.icon} size={tokens.extensions.breadcrumb.iconSize} color={colors.textSecondary} />
            )}
            <KText
              style={{
                color:
                  i === items.length - 1 ? colors.text : colors.textSecondary,
                fontWeight: i === items.length - 1 ? typeStyle('label').fontWeight : typeStyle('body').fontWeight,
              }}
            >
              {item.label}
            </KText>
          </View>
        );
        return (
          <Fragment key={i}>
            {i > 0 && (
              <DsIcon
                name="chevron-right"
                size={tokens.extensions.breadcrumb.separatorSize}
                color={colors.textTertiary}
              />
            )}{" "}
            {item.to && i < items.length - 1
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
export interface DsPaginationProps {
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
export function DsPagination({
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
}: DsPaginationProps) {
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
    <DsButton
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
      accessibilityLabel="페이지 탐색"
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
          {(current - 1) * pageSize + 1} -{" "}
          {Math.min(current * pageSize, totalRows)} / {formatter(totalRows)}개
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
          <View style={{ minWidth: tokens.extensions.pagination.selectorMinimumWidth }}><DsSelect
            size="sm"
            ariaLabel="페이지당 항목 수"
            value={pageSize}
            options={pageSizeOptions.map((n) => ({
              value: n,
              label: `${n}개씩`,
            }))}
            onValueChange={(v) => {
              onPageSizeChange?.(Number(v));
              onPageChange?.(1);
              onChange?.(1);
            }}
          /></View>
        )}
        {totalPages > 1 && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.pagination.itemGap, marginLeft: compact ? "auto" : undefined }}>
        {!compact && showFirstLast && button(1, "첫 페이지", "chevrons-left")}
        {button(current - 1, "이전 페이지", "chevron-left")}
        {compact ? (
          <KText style={{ paddingHorizontal: tokens.extensions.pagination.labelPaddingX, color: colors.text, fontVariant: ["tabular-nums"] }}>
            <KText style={{ fontWeight: typeStyle('control').fontWeight }}>{current}</KText> / {totalPages}
          </KText>
        ) : (
          pages.map((n, i) =>
            typeof n === "string" ? (
              <KText key={"dots" + i}>...</KText>
            ) : (
              <DsButton
                key={n}
                style={pageButtonStyle}
                size="sm"
                variant={current === n ? "primary" : "ghost"}
                ariaLabel={`${n} 페이지`}
                onPress={() => change(n)}
              >
                {n}
              </DsButton>
            )
          )
        )}
        {button(current + 1, "다음 페이지", "chevron-right")}
        {!compact &&
          showFirstLast &&
          button(totalPages, "마지막 페이지", "chevrons-right")}
        </View>}
      </View>
    </View>
  );
}
