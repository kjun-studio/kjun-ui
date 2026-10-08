import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { VisualCases } from './visual-contract-react-common';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><VisualCases K={K}/></K.KjunProvider>);
