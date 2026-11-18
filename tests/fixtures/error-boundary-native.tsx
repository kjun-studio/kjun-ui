import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { ErrorBoundaryCases } from './error-boundary-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><ErrorBoundaryCases K={K} /></K.KjunProvider>);
