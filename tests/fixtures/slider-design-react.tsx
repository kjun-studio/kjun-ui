import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { SliderDesignCases, setupSliderColors } from './slider-design-cases';
setupSliderColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><SliderDesignCases K={K} /></K.KjunProvider>);
