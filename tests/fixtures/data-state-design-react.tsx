import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { DataStateCases } from './data-state-design-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><DataStateCases K={K} /></K.KjunProvider>);
