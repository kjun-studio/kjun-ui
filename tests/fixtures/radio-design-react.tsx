import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { RadioDesignCases, setupRadioColors } from './radio-design-cases';
setupRadioColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><RadioDesignCases K={K} /></K.KjunProvider>);
