import { createContext } from 'react';

/** Set by a KjunCard on a tinted surface: badges inside paint the plain surface colour so they do not dissolve into the fill. */
export const CardTintContext = createContext(false);
