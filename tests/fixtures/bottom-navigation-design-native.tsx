import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { NavigationDesignCases } from './bottom-navigation-design-cases';
import { setupNavigationColors, navigationColors } from './bottom-navigation-design-data';
setupNavigationColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={navigationColors} fontFamily="Arial"><NavigationDesignCases K={K} /></K.KjunProvider>);
