import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { TopNavigationDesignCases } from './top-navigation-design-cases';
import { setupTopNavigationColors } from './top-navigation-design-data';
setupTopNavigationColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TopNavigationDesignCases K={K} /></K.KjunProvider>);
