import { createContext } from "react";
import type { InputSize } from "@kjun/tokens";

// Only a composed control's trigger consumes this; popup content keeps its own sizes.
export const CompoundControlContext = createContext<InputSize | null>(null);
