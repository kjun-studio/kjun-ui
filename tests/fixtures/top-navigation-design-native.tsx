import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { TopNavigationDesignCases } from './top-navigation-design-cases';
import { setupTopNavigationColors, topNavigationColors } from './top-navigation-design-data';
setupTopNavigationColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={topNavigationColors} fontFamily="Arial"><TopNavigationDesignCases K={K} native /></K.KjunProvider>);
