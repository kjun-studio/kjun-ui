import { createContext } from 'react';

/** Set by a KjunTiles cell: a KjunCard inside fills the cell's height, so cards in a row share one height (Web gets this from the grid). */
export const TileCellContext = createContext(false);
