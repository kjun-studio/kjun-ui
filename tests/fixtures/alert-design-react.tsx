import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { AlertCases } from './alert-design-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><AlertCases K={K} /></K.KjunProvider>);
