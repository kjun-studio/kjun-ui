import { createContext } from "react";

/** Set by KjunCard around its header actions: buttons there wrap long labels instead of overflowing the card. */
export const CardActionsContext = createContext(false);
