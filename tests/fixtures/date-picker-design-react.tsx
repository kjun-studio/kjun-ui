import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { DatePickerCases, setupDateColors } from './date-picker-design-cases';
setupDateColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><DatePickerCases K={K} /></K.KjunProvider>);
