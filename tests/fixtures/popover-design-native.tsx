import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { PopoverDesignCases } from './popover-design-cases';
import { setupPopoverColors, popoverColors } from './popover-design-data';
setupPopoverColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={popoverColors} fontFamily="Arial"><PopoverDesignCases K={K} /></K.KjunProvider>);
