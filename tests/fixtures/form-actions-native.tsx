import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { FormActionsCases, demoFont, demoPalettes } from './form-actions-cases';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><FormActionsCases K={K} native /></K.KjunProvider>);
