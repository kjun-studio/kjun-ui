import { createContext } from 'react';

/** Set by a KjunCard on a tinted surface: badges inside paint the plain surface colour so they do not dissolve into the fill. */
export const CardTintContext = createContext(false);

/** Set by a KjunCard on the brand surface: primary and link buttons inside take the brand-action roles, so they do not take the card's own colour. */
export const CardBrandContext = createContext(false);

/** Set by a KjunCard around its body: the body's padding, which a bleeding KjunListSection reaches past to the card's edge. */
export const CardBodyInsetContext = createContext<number | null>(null);
