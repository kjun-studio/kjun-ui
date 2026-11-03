import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { SliderDesignCases, setupSliderColors, sliderLocale } from './slider-design-cases';
setupSliderColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider locale={sliderLocale}><SliderDesignCases K={K} /></K.KjunProvider>);
