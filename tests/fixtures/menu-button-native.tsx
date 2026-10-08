import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { MenuButtonCases, demoFont, demoPalettes } from './menu-button-cases';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><MenuButtonCases K={K} native /></K.KjunProvider>);
