import { createContext } from 'react';

// State fallbacks own spacing and allow their actions to wrap within the region.
export const DataStateContentContext = createContext<'empty' | 'message' | null>(null);
