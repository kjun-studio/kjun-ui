import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { FormActionsCases, applyDemoColors } from './form-actions-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><FormActionsCases K={K} /></K.KjunProvider>);
