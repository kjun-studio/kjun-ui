import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { demoPalettes, demoDomainPalettes, demoFont } from '../../shared/demo-colors';
import { VisualCases } from './visual-contract-react-common';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><VisualCases K={K} native/></K.KjunProvider>);
