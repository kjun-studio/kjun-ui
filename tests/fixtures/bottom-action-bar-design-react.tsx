import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { BottomActionBarDesignCases } from './bottom-action-bar-design-cases';
import { setupActionBarColors } from './bottom-action-bar-design-data';
setupActionBarColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><BottomActionBarDesignCases K={K} /></K.KjunProvider>);
