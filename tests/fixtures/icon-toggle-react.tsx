import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { ToggleCases } from './icon-toggle-cases';
import { setup } from './icon-toggle-values';
setup();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ToggleCases K={K} /></K.KjunProvider>);
