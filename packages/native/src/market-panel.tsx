import { tokens } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { View } from "react-native";
import { KjunCard } from "./display";
import { MarketPanelInset } from "./market-parts";

/** Like Web .kjun-market-list-panel-list: the list runs to the card's edges, its rows' text lines up with the controls, no divider. */
export function KjunMarketListPanel({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  const inset = tokens.card.padding.md;
  return (
    <KjunCard>
      <View>{controls}</View>
      <View style={{ marginTop: tokens.dimension.value12, marginHorizontal: -inset }}>
        <MarketPanelInset.Provider value={inset}>{children}</MarketPanelInset.Provider>
      </View>
    </KjunCard>
  );
}
