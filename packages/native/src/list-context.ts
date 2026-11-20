import { createContext } from "react";

/**
 * The enclosing KjunListSection's shape: whether it is open, details or compact, so its rows and a row skeleton in its loading
 * slot draw the same row (open rows' larger lines, compact rows' height).
 */
export const ListShapeContext = createContext<{ open: boolean; details?: boolean; compact: boolean; muted?: boolean }>({ open: false, compact: false });
