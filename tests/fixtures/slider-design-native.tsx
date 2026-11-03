import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { SliderDesignCases, setupSliderColors, sliderColors, sliderLocale } from './slider-design-cases';
setupSliderColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={sliderColors} locale={sliderLocale}><SliderDesignCases K={K} /></K.KjunProvider>);
