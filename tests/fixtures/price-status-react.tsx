import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { PriceStatusCases } from './price-status-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><PriceStatusCases K={K} /></K.KjunProvider>);
