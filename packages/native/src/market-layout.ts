import { tokens } from "@kjun-ui/tokens";
import { useState } from "react";
import { type LayoutChangeEvent, type ViewStyle } from "react-native";
import { type LayoutColumn, marketGeometry, nativeMarketLayout } from "../../../shared/package-runtime/market-layout";

export { marketGeometry };
export function useMarketLayout(columns: LayoutColumn[], showActions: boolean) {
  const [containerWidth, setContainerWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => setContainerWidth(event.nativeEvent.layout.width);
  return { ...nativeMarketLayout(columns, showActions, containerWidth), onLayout };
}
export const marketHeaderStyle: ViewStyle = { minHeight: marketGeometry.headerHeight, flexDirection: "row", borderBottomWidth: tokens.border.defaultWidth };
export const marketRowStyle: ViewStyle = { minHeight: marketGeometry.rowHeight, flexDirection: "row", borderBottomWidth: tokens.border.defaultWidth };
