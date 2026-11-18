import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TimePickerCases } from './time-picker-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<TimePickerCases K={K} />);
