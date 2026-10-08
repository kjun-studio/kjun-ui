import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { PopoverDesignCases } from './popover-design-cases';
import { setupPopoverColors } from './popover-design-data';
setupPopoverColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><PopoverDesignCases K={K} /></K.KjunProvider>);
