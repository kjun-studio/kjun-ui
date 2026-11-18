import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { FabCases, demoFont, demoPalettes } from './fab-cases';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><FabCases K={K} native /></K.KjunProvider>);
