import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { FabCases, applyDemoColors } from './fab-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><FabCases K={K} /></K.KjunProvider>);
