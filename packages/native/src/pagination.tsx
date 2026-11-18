import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { paginationItems, pageRows } from "../../../shared/package-runtime/pagination";
import { tokens, type ButtonSize } from "@kjun-ui/tokens";
import { Platform, View, useWindowDimensions } from "react-native";
import { typeStyle } from "./typography";
import { KjunButton } from "./button";
import { KText } from "./internal";
import { useKjunStyles } from "./provider";
import { KjunDropdown, KjunDropdownItem } from "./dropdown";
import { KjunIcon } from "./button";
import { AccessiblePressable as Pressable } from "./a11y";

export type KjunPaginationLayout = "auto" | "full" | "compact";
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
  /** "auto" switches to the short form below the pagination breakpoint; "full" and "compact" keep one form. */
  layout?: KjunPaginationLayout;
  /** Locks every control, for example while the next page loads. The current page keeps its fill. */
  disabled?: boolean;
  formatter?: (value: number) => string;
  onPageChange?: (page: number) => void;
  onChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}
// The current page: aria-current on Native Web, as on Web (a selected state there would read as aria-pressed);
// iOS and Android have no aria-current, so their screen readers get the selected state.
const currentMark = Platform.OS === "web" ? ({ "aria-current": "page" } as object) : { accessibilityState: { selected: true } };
export function KjunPagination({
  currentPage: currentProp,
  page,
  totalPages,
  totalRows = 0,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  siblingCount = 1,
  showInfo = false,
  showSizeSelector = false,
  showFirstLast = true,
  layout = "auto",
  disabled = false,
  formatter = String,
  onPageChange,
  onChange,
  onPageSizeChange,
}: KjunPaginationProps) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    window = useWindowDimensions(),
    current = Math.max(1, Math.min(totalPages, currentProp ?? page ?? 1));
  if (totalPages <= 1 && !showSizeSelector && !(showInfo && totalRows > 0)) return null;
  const compact = layout === "compact" || (layout === "auto" && window.width < tokens.responsive.pagination);
  const change = (v: number) => {
    if (disabled || v < 1 || v > totalPages || v === current) return;
    onPageChange?.(v);
    onChange?.(v);
  };
  const rows = pageRows(current, pageSize, totalRows);
  const item = tokens.extensions.pagination.itemSize;
  // Painted at Web's item size; KjunButton's hitSlop reaches the 44pt touch target around it.
  const pageButtonStyle = { width: item, height: item, borderRadius: tokens.extensions.pagination.radius, paddingHorizontal: 0 };
  // Page numbers and the size button draw at Web's 32px item; hitSlop reaches the 44pt touch target around them.
  const hit = Math.max(0, (tokens.native.minimumTouchTarget - item) / 2), slop = { top: hit, bottom: hit, left: hit, right: hit };
  const body = typeStyle("body");
  const pageButton = (n: number) => {
    const active = current === n, blocked = disabled && !active;
    return (
      <Pressable
        key={n}
        accessibilityRole="button"
        accessibilityLabel={m.page(n)}
        disabled={blocked}
        {...(active ? currentMark : {})}
        hitSlop={slop}
        onPress={() => change(n)}
        style={({ pressed }) => ({ ...pageButtonStyle, alignItems: "center", justifyContent: "center",
          backgroundColor: active ? colors.brand : pressed && !blocked ? colors.hover : "transparent" })}
      >
        {/* Web's page number: the body type at 400, brand ink on the current page. */}
        <KText style={{ ...body, fontSize: body.fontSize, fontWeight: body.fontWeight, fontVariant: ["tabular-nums"],
          color: active ? colors.onBrand : blocked ? colors.textDisabled : colors.textSecondary }}>{n}</KText>
      </Pressable>
    );
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
      disabled={disabled || target < 1 || target > totalPages || target === current}
      // An icon-only button centers the chevron and paints it with the ghost ink, like the page numbers and Web.
      prefixIcon={icon}
      onPress={() => change(target)}
    />
  );
  return (
    <View
      {...(Platform.OS === "web" ? { role: "navigation" as const } : {})}
      accessibilityLabel={m.pagination}
      style={{
        flexDirection: compact ? "column" : "row",
        flexWrap: compact ? "nowrap" : "wrap",
        alignItems: compact ? "stretch" : "center",
        justifyContent: "space-between",
        gap: tokens.extensions.pagination.gap,
        padding: tokens.extensions.pagination.padding,
      }}
    >
      {showInfo && totalRows > 0 ? (
        // One line, like Web: a narrow row moves the controls to the next line instead of wrapping the range.
        <KText numberOfLines={1} style={{ color: colors.textSecondary, fontVariant: ["tabular-nums"], flexShrink: 0 }}>
          {m.pageRange(formatter(rows.from), formatter(rows.to), formatter(totalRows))}
        </KText>
      ) : (
        <View />
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.pagination.itemGap, flexWrap: "wrap" }}>
        {showSizeSelector && (
          // A quiet text button that opens the sizes as single-choice menu items, at the range line's type size.
          <KjunDropdown
            placement="bottom-end"
            disabled={disabled}
            trigger={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={m.pageSizeMenu(m.perPage(pageSize))}
                disabled={disabled}
                hitSlop={slop}
                style={({ pressed }) => ({ height: item, flexDirection: "row", alignItems: "center", gap: tokens.dimension.value4,
                  paddingHorizontal: tokens.dimension.value8, borderRadius: tokens.extensions.pagination.radius,
                  backgroundColor: pressed && !disabled ? colors.hover : "transparent" })}
              >
                <KText style={{ ...body, color: disabled ? colors.textDisabled : colors.textSecondary }}>{m.perPage(pageSize)}</KText>
                <KjunIcon name="chevron-down" size={tokens.extensions.pagination.iconSize} color={disabled ? colors.textDisabled : colors.textSecondary} />
              </Pressable>
            }
          >
            {pageSizeOptions.map(n => (
              <KjunDropdownItem key={n} selected={n === pageSize} onPress={() => {
                if (n === pageSize) return;
                onPageSizeChange?.(n);
                onPageChange?.(1);
                onChange?.(1);
              }}>{m.perPage(n)}</KjunDropdownItem>
            ))}
          </KjunDropdown>
        )}
        {totalPages > 1 && <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.extensions.pagination.itemGap, marginLeft: compact ? "auto" : undefined }}>
          {!compact && showFirstLast && button(1, m.firstPage, "chevrons-left")}
          {button(current - 1, m.previousPage, "chevron-left")}
          {compact ? (
            <KText style={{ paddingHorizontal: tokens.extensions.pagination.labelPaddingX, color: colors.text, fontVariant: ["tabular-nums"] }}>
              <KText style={{ fontWeight: typeStyle("control").fontWeight }}>{current}</KText> / {totalPages}
            </KText>
          ) : (
            paginationItems(current, totalPages, siblingCount).map(n =>
              typeof n === "string" ? (
                // As wide as a page button, so the list keeps one width on every page and the arrows stay put.
                <KText key={n} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  {...({ "aria-hidden": true } as object)}
                  style={{ width: item, textAlign: "center", color: colors.textSecondary }}>…</KText>
              ) : pageButton(n)
            )
          )}
          {button(current + 1, m.nextPage, "chevron-right")}
          {!compact && showFirstLast && button(totalPages, m.lastPage, "chevrons-right")}
        </View>}
      </View>
    </View>
  );
}
