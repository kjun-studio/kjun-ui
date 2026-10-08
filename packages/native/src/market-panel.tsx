import { tokens } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { View } from "react-native";
import { DsCard } from "./display";
import { useKjunStyles } from "./provider";

export function DsMarketListPanel({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useKjunStyles();
  return (
    <DsCard>
      <View>{controls}</View>
      <View
        style={{
          marginTop: tokens.dimension.value16,
          borderTopWidth: tokens.border.defaultWidth,
          borderTopColor: colors.border,
        }}
      >
        {children}
      </View>
    </DsCard>
  );
}
