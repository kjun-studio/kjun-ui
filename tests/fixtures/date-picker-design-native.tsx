import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { DatePickerCases, setupDateColors, dateColors } from './date-picker-design-cases';
setupDateColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={dateColors} fontFamily="Arial"><DatePickerCases K={K} native /></K.KjunProvider>);
