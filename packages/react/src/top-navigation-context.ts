import { createContext } from 'react';
// Internal slot geometry; consuming applications still choose button variants.
export const TopNavigationContext = createContext<{ controlSize: number; iconSize: number } | null>(null);
