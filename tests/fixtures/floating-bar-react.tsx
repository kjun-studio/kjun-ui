import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { FloatingBarCases } from './floating-bar-cases';

applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><FloatingBarCases K={K} /></K.KjunProvider>);
