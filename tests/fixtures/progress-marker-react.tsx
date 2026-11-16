import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { ProgressMarkerCases, applyDemoColors } from './progress-marker-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ProgressMarkerCases K={K} Box="div" /></K.KjunProvider>);
