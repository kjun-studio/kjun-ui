import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { MenuButtonCases, applyDemoColors } from './menu-button-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><MenuButtonCases K={K} /></K.KjunProvider>);
