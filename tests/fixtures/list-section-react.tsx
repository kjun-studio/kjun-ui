import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListSectionCases } from './list-section-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListSectionCases K={K} /></K.KjunProvider>);
