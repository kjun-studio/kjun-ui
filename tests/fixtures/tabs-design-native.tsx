import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { TabsDesignCases } from './tabs-design-cases';
import { setupTabsColors, tabsColors } from './tabs-design-data';
setupTabsColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={tabsColors} fontFamily="Arial"><TabsDesignCases K={K} /></K.KjunProvider>);
