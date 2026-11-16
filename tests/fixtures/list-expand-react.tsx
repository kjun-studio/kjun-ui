import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListExpandCases } from './list-expand-cases';

applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListExpandCases K={K} /></K.KjunProvider>);
