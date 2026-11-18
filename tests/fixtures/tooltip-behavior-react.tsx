import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TooltipBehaviorCases } from './tooltip-behavior-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TooltipBehaviorCases K={K} /></K.KjunProvider>);
