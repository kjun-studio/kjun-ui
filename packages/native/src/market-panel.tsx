import { tokens } from "@kjun-ui/tokens";
import { type ReactNode } from "react";
import { View } from "react-native";
import { KjunCard } from "./display";
import { useKjunStyles } from "./provider";

export function KjunMarketListPanel({
  controls,
  children,
}: {
  controls?: ReactNode;
  children: ReactNode;
}) {
  const { colors } = useKjunStyles();
  return (
    <KjunCard>
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
    </KjunCard>
  );
}
