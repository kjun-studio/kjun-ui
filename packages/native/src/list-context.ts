import { createContext } from "react";

/**
 * The enclosing KjunListSection's shape: whether it is open, details or compact, so its rows and a row skeleton in its loading
 * slot draw the same row (open rows' larger lines, compact rows' height).
 */
/** inset: a bleeding section's horizontal inset for its rows (the card body's padding), in place of the rows' own 16. */
export const ListShapeContext = createContext<{ open: boolean; details?: boolean; compact: boolean; muted?: boolean; inset?: number }>({ open: false, compact: false });
