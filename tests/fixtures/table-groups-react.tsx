import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableGroupsCases } from './table-groups-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TableGroupsCases K={K} /></K.KjunProvider>);
