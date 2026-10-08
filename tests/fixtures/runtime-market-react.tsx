import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { MarketCases } from './runtime-market-cases';
import { setRootValues } from './style-values';
setRootValues();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><MarketCases K={K} /></K.KjunProvider>);
