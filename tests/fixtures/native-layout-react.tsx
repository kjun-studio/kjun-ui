import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { VisualCases } from './visual-contract-react-common';
import { initial, renderCases } from './native-layout-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><VisualCases K={K} initial={initial} renderCases={renderCases}/></K.KjunProvider>);
