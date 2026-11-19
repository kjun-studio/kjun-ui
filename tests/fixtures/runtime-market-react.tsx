import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { MarketCases } from './runtime-market-cases';
import { setRootValues } from './style-values';
import { cssColorName, demoDomainPalettes } from '../../shared/demo-colors';
setRootValues();
// Quotes use the price colours, which a KJUN app supplies.
for (const [role, value] of Object.entries(demoDomainPalettes.default)) document.documentElement.style.setProperty(cssColorName(role), value);
createRoot(document.getElementById('root')!).render(<K.KjunProvider><MarketCases K={K} /></K.KjunProvider>);
