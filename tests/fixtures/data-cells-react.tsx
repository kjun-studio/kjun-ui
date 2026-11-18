import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { DataCellsCases } from './data-cells-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><DataCellsCases K={K} /></K.KjunProvider>);
