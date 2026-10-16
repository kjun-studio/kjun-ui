import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { LoadingCases } from './loading-options-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><LoadingCases K={K} /></K.KjunProvider>);
