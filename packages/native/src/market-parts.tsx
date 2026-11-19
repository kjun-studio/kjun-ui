import { isSelectedMarketRow, marketBlockingError, marketTotal } from "../../../shared/package-runtime/market-query";
import { type ReactNode } from "react";
import { AccessiblePressable as Pressable } from "./a11y";
import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { Platform,View,useWindowDimensions,type TextStyle,type ViewStyle } from "react-native";
import { useQueryDisplay } from "./data-state";
import {
KjunCollectionMark
} from "./financial";
import { KText } from "./internal";
// Like Web .kjun-market-name: Korean names break between words, never inside one.
const words = (Platform.OS === "web" ? { wordBreak: "keep-all", overflowWrap: "break-word" } : {}) as unknown as TextStyle;
import { MarketBaseProps } from "./market-model";
import { KjunPagination } from "./navigation";
import { useKjunStyles } from "./provider";
import { getValue } from "./table";
export function MarketIdentity<Row extends object>({
  row,
  props,
  table = false,
  compact = false,
}: {
  row: Row;
  props: MarketBaseProps<Row>;
  table?: boolean;
  // Card rows keep the compact label and caption roles on narrow screens, like Web .kjun-market-row-compact.
  compact?: boolean;
}) {
  const { colors } = useKjunStyles(),
    mobile = useWindowDimensions().width < tokens.responsive.market && !table && !compact,
    label = props.primaryLabel?.(row) ?? String(getValue(row, "name") ?? ""),
    meta = props.subMeta?.(row) || "",
    id = getValue(row, props.rowKey || "id");
  const body = (
    <>
      {props.renderNamePrefix?.(row)}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: tokens.dimension.value4,
            minWidth: 0,
          }}
        >
          <KText
            numberOfLines={mobile ? 2 : 1}
            lineBreakStrategyIOS="hangul-word"
            style={{
              // Like Web .kjun-market-name: label type, and input type on narrow simple lists.
              ...typeStyle(table ? "body" : mobile ? "input" : "label"),
              ...words,
              flexShrink: 1,
            }}
          >
            {label}
          </KText>
          {props.interestKeys?.has(id) && (
            <KjunCollectionMark kind="interest" size="sm" active />
          )}
          {props.favoriteKeys?.has(id) && (
            <KjunCollectionMark kind="favorite" size="sm" active />
          )}
          {props.renderNameSuffix?.(row)}
        </View>
        {(meta || props.renderSubMeta) && (
          <View style={{ marginTop: tokens.dimension.value2 }}>
            {props.renderSubMeta?.(row) || (
              <KText
                numberOfLines={1}
                style={{
                  // Like Web .kjun-market-meta: caption, and body type on narrow simple lists.
                  ...typeStyle(mobile ? "body" : "caption"),
                  color: colors.textTertiary,
                }}
              >
                {meta}
              </KText>
            )}
          </View>
        )}
      </View>
    </>
  );
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        minWidth: 0,
        flex: 1,
      }}
    >
      {props.renderIdentity?.(row, body) || body}
    </View>
  );
}
/**
 * Like Web MarketRow: a button only when the app listens for presses (reached by screen readers and the keyboard),
 * otherwise a plain row with no press fill; the selected row keeps the secondary fill and reads as current.
 */
export function MarketRow<Row extends object>({
  row,
  props,
  selectedKey,
  style,
  children,
}: {
  row: Row;
  props: MarketBaseProps<Row>;
  selectedKey?: unknown;
  style: ViewStyle;
  children: ReactNode;
}) {
  const { colors } = useKjunStyles(),
    selected = isSelectedMarketRow(getValue(row, props.rowKey || "id"), selectedKey),
    rest = { ...style, borderBottomWidth: tokens.border.defaultWidth, borderBottomColor: colors.border };
  // A button's selected state reads as pressed, so the web gets aria-current and devices the selected state.
  const current = Platform.OS === "web" ? { "aria-current": selected || undefined } : {};
  if (!props.onRowClick)
    return (
      <View {...current} accessibilityState={Platform.OS === "web" ? undefined : { selected }}
        style={{ ...rest, backgroundColor: selected ? colors.secondary : undefined }}>
        {children}
      </View>
    );
  return (
    <Pressable
      {...current}
      accessibilityRole="button"
      accessibilityState={Platform.OS === "web" ? undefined : { selected }}
      focusRingInset
      onPress={() => props.onRowClick?.(row)}
      style={({ pressed }) => ({ ...rest, backgroundColor: pressed ? colors.hover : selected ? colors.secondary : undefined })}
    >
      {children}
    </Pressable>
  );
}
export function MarketFooter<Row extends object>({
  props,
}: {
  props: MarketBaseProps<Row>;
}) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    state = useQueryDisplay(props),
    // A blocking error replaces the rows, so their count, update time and pages go with them.
    hidden = marketBlockingError(props, state),
    {
      pagination,
      rows = [],
      showFooter = true,
      calculatedAt,
      footerNote,
      unitLabel = m.unitLabel,
    } = props;
  return (
    <>
      {pagination && !hidden && (
        <KjunPagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.size)}
          totalRows={pagination.total}
          pageSize={pagination.size}
          showInfo
          onPageChange={props.onPageChange}
        />
      )}
      {showFooter && !hidden && !state.initialLoading && rows.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: tokens.dimension.value8,
            paddingVertical: tokens.dimension.value12,
            paddingHorizontal: tokens.dimension.value16,
          }}
        >
          <KText style={{ ...typeStyle('caption'), color: colors.textTertiary }}>
            {calculatedAt
              ? m.lastUpdated +
                (props.formatDate?.(calculatedAt) || calculatedAt)
              : footerNote}
          </KText>
          <KText style={{ ...typeStyle('caption'), color: colors.textTertiary }}>
            {m.totalCount(marketTotal(props.totalCount, pagination, rows.length), unitLabel)}
          </KText>
        </View>
      )}
    </>
  );
}
