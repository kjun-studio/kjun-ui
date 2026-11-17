import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { NumberInputCases } from './number-input-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<NumberInputCases K={K} />);
