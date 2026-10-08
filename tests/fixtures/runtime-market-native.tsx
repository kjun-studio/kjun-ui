import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { MarketCases } from './runtime-market-cases';
import { appColors } from './style-values';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={appColors}><MarketCases K={K} /></K.KjunProvider>);
