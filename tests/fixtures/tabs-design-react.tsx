import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { TabsDesignCases } from './tabs-design-cases';
import { setupTabsColors, tabsColors } from './tabs-design-data';
setupTabsColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TabsDesignCases K={K} /></K.KjunProvider>);
