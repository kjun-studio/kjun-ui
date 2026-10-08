import { LayerScope, useLayerState } from "../../../shared/package-runtime/use-layer";
import {
createContext,
useContext,
useEffect,
useId,
type ReactNode,
} from "react";
import { Platform,View,type ModalProps } from "react-native";
import { ModalWindow } from './modal-window';
export interface FeedbackOverlayHost {
  top: string | undefined;
  register: (id: string) => () => void;
  render: () => ReactNode;
}
export const FeedbackOverlayContext = createContext<FeedbackOverlayHost | null>(
  null
);
// Keep feedback in the top native window; a sibling View cannot paint above Modal.
export function ScopedNativeModal({ children, visible, ...props }: ModalProps) {
  const layers = useLayerState(), scope = useContext(LayerScope);
  const entry = scope ? layers.entries.get(scope) : undefined;
  const generation = entry?.order ?? 0;
  const inactive = !!scope && !layers.isActive(scope);
  const host = useContext(FeedbackOverlayContext),
    id = useId(),
    register = host?.register;
  useEffect(
    () => (visible && register ? register(id) : undefined),
    [visible, register, id, generation]
  );
  return (
    // Native windows open in their own platform stack. A new opening must create
    // a new window even when an interrupted exit retained the old surface.
    <ModalWindow generation={generation} {...props} visible={visible}
      accessibilityElementsHidden={inactive} importantForAccessibility={inactive ? "no-hide-descendants" : "auto"}
      // RN Web drops `inert`; an exiting or covered window must still let presses through.
      pointerEvents={inactive ? "none" : undefined}
      {...(Platform.OS === "web" ? { inert: inactive, "aria-hidden": inactive || undefined } : {})}
    >
      {children}
      {host?.top === id && (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", inset: 0 }}
        >
          {host.render()}
        </View>
      )}
    </ModalWindow>
  );
}
