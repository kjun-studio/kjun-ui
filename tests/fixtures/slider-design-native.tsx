import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { SliderDesignCases, setupSliderColors, sliderColors } from './slider-design-cases';
setupSliderColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={sliderColors}><SliderDesignCases K={K} /></K.KjunProvider>);
