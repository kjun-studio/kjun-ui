import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { RadioDesignCases, setupRadioColors, radioColors } from './radio-design-cases';
setupRadioColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={radioColors} fontFamily="Arial"><RadioDesignCases K={K} /></K.KjunProvider>);
