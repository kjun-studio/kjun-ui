import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { ScrollView, View } from "react-native";
import { isMarketIdentity, normalizeMarketColumns } from "../../../shared/package-runtime/market-layout";
import { DsSkeleton } from "./display";
import { KText } from "./internal";
import { useMarketLayout, marketGeometry, marketHeaderStyle, marketRowStyle } from "./market-layout";
import { useKjunStyles } from "./provider";
export interface DsMarketTableSkeletonProps {
  columns?: ({ key?: string; label?: string; width?: string | number; align?: "left" | "right" | "center" } | string)[];
  rows?: number;
  showActions?: boolean;
}
export function DsMarketTableSkeleton({ columns = [], rows = 8, showActions = false }: DsMarketTableSkeletonProps) {
  const { colors } = useKjunStyles();
  const cols = normalizeMarketColumns(columns), layout = useMarketLayout(cols, showActions);
  const actions = { width: marketGeometry.actionsWidth, paddingVertical: tokens.dimension.value12, paddingHorizontal: tokens.dimension.value4, justifyContent: "center" as const, alignItems: "center" as const };
  return <ScrollView horizontal onLayout={layout.onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={{ width: layout.width }}>
      <View style={{ ...marketHeaderStyle, borderBottomColor: colors.border }}>
        {showActions && <View style={actions}><DsSkeleton type="block" width={tokens.extensions.marketTable.actionSkeletonWidth} height={tokens.extensions.marketTable.headerSkeletonHeight} /></View>}
        {cols.map((col, i) => <View key={col.key || i} style={{ width: layout.widths[i], padding: tokens.dimension.value12, justifyContent: "center" }}>
          <KText style={{ ...typeStyle('meta'),   color: colors.textTertiary, textAlign: col.align }}>{col.label}</KText>
        </View>)}
      </View>
      {Array.from({ length: Math.max(0, rows) }, (_, row) => <View key={row} style={{ ...marketRowStyle, borderBottomColor: colors.border }}>
        {showActions && <View style={actions}><DsSkeleton type="block" width={tokens.extensions.marketTable.actionSkeletonWidth} height={tokens.extensions.financial.priceSkeletonHeight} /></View>}
        {cols.map((col, i) => <View key={col.key || i} style={{ width: layout.widths[i], paddingVertical: tokens.dimension.value14, paddingHorizontal: tokens.dimension.value12, justifyContent: "center", alignItems: isMarketIdentity(col.key) ? undefined : col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
          {isMarketIdentity(col.key) ? <View style={{ gap: tokens.dimension.value2 }}>
            <View style={{ height: tokens.typography.body.lineHeightPx, justifyContent: "center" }}><DsSkeleton type="block" width="80%" height={tokens.extensions.skeleton.lineHeights.md} /></View>
            <View style={{ height: tokens.typography.caption.lineHeightPx, justifyContent: "center" }}><DsSkeleton type="block" width="60%" height={tokens.extensions.skeleton.lineHeights.sm} /></View>
          </View> : <DsSkeleton type="block" width={tokens.extensions.financial.priceSkeletonWidth} height={tokens.extensions.financial.priceSkeletonHeight} />}
        </View>)}
      </View>)}
    </View>
  </ScrollView>;
}
