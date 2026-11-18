import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { demoPalettes } from '../../shared/demo-colors';
import { TooltipBehaviorCases } from './tooltip-behavior-cases';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily="Arial"><TooltipBehaviorCases K={K} native /></K.KjunProvider>);
