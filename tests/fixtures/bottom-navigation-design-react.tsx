import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { NavigationDesignCases } from './bottom-navigation-design-cases';
import { setupNavigationColors } from './bottom-navigation-design-data';
setupNavigationColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><NavigationDesignCases K={K} /></K.KjunProvider>);
