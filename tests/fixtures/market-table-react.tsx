import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { MarketTableCases } from './market-table-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><MarketTableCases K={K} /></K.KjunProvider>);
