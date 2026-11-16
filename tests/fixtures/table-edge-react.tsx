import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableEdgeCases } from './table-edge-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TableEdgeCases K={K} /></K.KjunProvider>);
