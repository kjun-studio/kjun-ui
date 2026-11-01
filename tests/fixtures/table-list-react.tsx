import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableListCases } from './table-list-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TableListCases K={K} /></K.KjunProvider>);
