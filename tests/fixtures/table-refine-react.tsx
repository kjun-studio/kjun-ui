import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableRefineCases } from './table-refine-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TableRefineCases K={K} /></K.KjunProvider>);
