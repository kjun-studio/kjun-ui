import { createContext } from 'react';
// Only action-bar children expand: the positive ones in the compact layout (true), every labelled one in a floating bar
// without a description ("fill").
export const BottomActionBarContext = createContext<boolean | "fill">(false);
