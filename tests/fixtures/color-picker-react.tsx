import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ColorPickerCases } from './color-picker-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<ColorPickerCases K={K} />);
