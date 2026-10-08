import { createContext, useContext } from "react";
import type { KjunFeedback } from "@kjun-ui/tokens";

export const KjunFeedbackContext = createContext<KjunFeedback | null>(null);

export function useOptionalKjunFeedback() {
  return useContext(KjunFeedbackContext);
}
