import { createContext } from 'react';

export const FormActionsContext = createContext<{ stacked: boolean } | null>(null);
