import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ErrorBoundaryCases } from './error-boundary-cases';
applyDemoColors('default');
// React reports a caught render error to the console; the page records it like any other.
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ErrorBoundaryCases K={K} /></K.KjunProvider>);
