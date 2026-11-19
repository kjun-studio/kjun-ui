import type { ReactNode } from "react";
import { View } from "react-native";
import { tokens } from "@kjun-ui/tokens";
import { finePointer } from "./internal";

// The visible surface follows the web geometry; the surrounding target stays touchable.
export function CompoundTarget({ children, square = false }: { children: ReactNode; square?: boolean }) {
  const touch = finePointer() ? undefined : tokens.native.minimumTouchTarget;
  return <View style={{ minHeight: touch, minWidth: square ? touch : undefined, alignItems: "center", justifyContent: "center" }}>{children}</View>;
}
