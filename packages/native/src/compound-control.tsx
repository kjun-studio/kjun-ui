import { createContext, type ReactNode, type RefObject } from "react";
import { View } from "react-native";
import { tokens, type InputSize } from "@kjun/tokens";
import { finePointer } from "./internal";

export const CompoundControlContext = createContext<{
  size: InputSize; focusRef?: RefObject<View | null>; onFocusChange?: (focused: boolean) => void;
  /** First time segment: its value starts on the field text line. */
  leading?: boolean;
} | null>(null);

// The visible surface follows the web geometry; the surrounding target stays touchable.
export function CompoundTarget({ children, square = false }: { children: ReactNode; square?: boolean }) {
  const touch = finePointer() ? undefined : tokens.native.minimumTouchTarget;
  return <View style={{ minHeight: touch, minWidth: square ? touch : undefined, alignItems: "center", justifyContent: "center" }}>{children}</View>;
}
