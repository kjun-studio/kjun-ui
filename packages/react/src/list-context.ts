import { createContext } from "react";

/** Whether the enclosing KjunListSection is open, so a row skeleton in its loading slot draws the open row's shape. */
export const ListOpenContext = createContext(false);
