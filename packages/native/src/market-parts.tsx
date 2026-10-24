import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { View,useWindowDimensions } from "react-native";
import { useQueryDisplay } from "./data-state";
import {
KjunCollectionMark
} from "./financial";
import { KText } from "./internal";
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
            style={{
              // Like Web .kjun-market-name: label type, and input type on narrow simple lists.
              ...typeStyle(table ? "body" : mobile ? "input" : "label"),
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
export function MarketFooter<Row extends object>({
  props,
}: {
  props: MarketBaseProps<Row>;
}) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles(),
    state = useQueryDisplay(props),
    {
      pagination,
      rows = [],
      showFooter = true,
      calculatedAt,
      footerNote,
      totalCount = 0,
      unitLabel = m.unitLabel,
    } = props;
  return (
    <>
      {pagination && (
        <KjunPagination
          currentPage={pagination.page}
          totalPages={Math.ceil(pagination.total / pagination.size)}
          totalRows={pagination.total}
          pageSize={pagination.size}
          showInfo
          onPageChange={props.onPageChange}
        />
      )}{" "}
      {showFooter && !state.initialLoading && rows.length > 0 && (
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
            {m.totalCount(totalCount, unitLabel)}
          </KText>
        </View>
      )}
    </>
  );
}
