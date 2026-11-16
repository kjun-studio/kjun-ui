import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListValueCases } from './list-value-cases';

applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListValueCases K={K} /></K.KjunProvider>);
