import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { BottomActionBarDesignCases } from './bottom-action-bar-design-cases';
import { setupActionBarColors, actionBarColors } from './bottom-action-bar-design-data';
setupActionBarColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={actionBarColors} fontFamily="Arial"><BottomActionBarDesignCases K={K} native /></K.KjunProvider>);
