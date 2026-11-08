import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListLeadingCases } from './list-leading-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListLeadingCases K={K} /></K.KjunProvider>);
