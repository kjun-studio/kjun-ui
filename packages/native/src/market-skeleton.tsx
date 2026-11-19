import { tokens } from "@kjun-ui/tokens";
import { typeStyle } from "./typography";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { isMarketIdentity, normalizeMarketColumns } from "../../../shared/package-runtime/market-layout";
import { skeletonCount, skeletonRowWidths, skeletonWidthScale } from "../../../shared/package-runtime/skeleton-text";
import { KjunSkeleton } from "./display";
import { KjunCollectionMark } from "./financial-display";
import { KText } from "./internal";
import { useMarketLayout, marketGeometry, marketHeaderStyle, marketRowStyle } from "./market-layout";
import { useKjunStyles } from "./provider";
import { skeletonStatus } from "./skeleton-clock";
export interface KjunMarketTableSkeletonProps {
  columns?: ({ key?: string; label?: string; width?: string | number; align?: "left" | "right" | "center" } | string)[];
  rows?: number;
  showActions?: boolean;
  /** Announces loading to screen readers (a status); the table itself stays silent. */
  loadingText?: string;
  style?: StyleProp<ViewStyle>;
}
export function KjunMarketTableSkeleton({ columns = [], rows = 8, showActions = false, loadingText, style }: KjunMarketTableSkeletonProps) {
  const { colors } = useKjunStyles();
  const cols = normalizeMarketColumns(columns), layout = useMarketLayout(cols, showActions);
  const actions = { width: layout.actionsWidth, paddingVertical: tokens.dimension.value12, paddingHorizontal: tokens.dimension.value4, flexDirection: "row" as const, justifyContent: "center" as const, alignItems: "center" as const };
  // Like the loaded table: header marks and row toggles share IconToggle xs squares.
  const toggle = tokens.extensions.iconToggle.sizes.xs, slot = { width: toggle, alignItems: "center" as const };
  // Like Web: the status (when given loading text) carries the words; the table stays out of the accessibility tree.
  return <View {...skeletonStatus(loadingText)} style={style}><ScrollView horizontal onLayout={layout.onLayout} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <View style={{ width: layout.width }}>
      <View style={{ ...marketHeaderStyle, borderBottomColor: colors.border }}>
        {/* Like Web: the header marks show as they will, each in the column its row toggle takes. */}
        {showActions && <View style={actions}>{(["interest", "favorite"] as const).map(kind => <View key={kind} style={slot}><KjunCollectionMark kind={kind} size="md" /></View>)}</View>}
        {cols.map((col, i) => <View key={col.key || i} style={{ width: layout.widths[i], paddingVertical: tokens.dimension.value12, paddingHorizontal: layout.compact ? tokens.dimension.value4 : tokens.dimension.value12, justifyContent: "center" }}>
          <KText style={{ ...typeStyle('meta'),   color: colors.textTertiary, textAlign: col.align }}>{col.label}</KText>
        </View>)}
      </View>
      {Array.from({ length: skeletonCount(rows) }, (_, row) => <View key={row} style={{ ...marketRowStyle, borderBottomColor: colors.divider }}>
        {showActions && <View style={actions}>{[0, 1].map(i => <View key={i} style={slot}><View style={{ width: toggle, height: toggle, borderRadius: tokens.extensions.iconToggle.radii.xs, overflow: "hidden" }}><KjunSkeleton type="block" height={toggle} /></View></View>)}</View>}
        {cols.map((col, i) => <View key={col.key || i} style={{ width: layout.widths[i], paddingVertical: tokens.dimension.value14, paddingHorizontal: layout.compact ? tokens.dimension.value4 : tokens.dimension.value12, justifyContent: "center", alignItems: isMarketIdentity(col.key) ? undefined : col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start" }}>
          {isMarketIdentity(col.key) ? <View style={{ gap: tokens.dimension.value2 }}>
            <KjunSkeleton type="line" role="body" width={skeletonRowWidths(row, true).title} />
            <KjunSkeleton type="line" role="caption" width={skeletonRowWidths(row, true).detail} />
          </View> : <KjunSkeleton type="line" role="numberSm" width={tokens.extensions.financial.priceSkeletonWidth * skeletonWidthScale(row + i)} />}
        </View>)}
      </View>)}
    </View>
  </ScrollView></View>;
}
