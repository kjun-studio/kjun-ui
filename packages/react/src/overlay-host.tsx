import { LayerScope, useLayerState } from "../../../shared/package-runtime/use-layer";
import {
createContext,
useContext,
useLayoutEffect,
useId,
type ReactNode,
} from "react";
export interface FeedbackOverlayHost {
  top: string | undefined;
  register: (id: string, order: number) => () => void;
  render: () => ReactNode;
}
export const FeedbackOverlayContext = createContext<FeedbackOverlayHost | null>(
  null
);
// Keep actionable toast content in the active dialog's focus and accessibility scope.
export function FeedbackLayerOutlet() {
  const layers = useLayerState(), scope = useContext(LayerScope);
  const entry = scope ? layers.entries.get(scope) : undefined;
  const active = !!entry && layers.isActive(entry.id), order = entry?.order ?? 0;
  const host = useContext(FeedbackOverlayContext),
    id = useId(),
    register = host?.register;
  // A retained window can become active again without mounting a new outlet.
  useLayoutEffect(() => active ? register?.(id, order) : undefined, [register, id, active, order]);
  return host?.top === id ? host.render() : null;
}
