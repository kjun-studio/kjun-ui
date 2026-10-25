import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { RoundedCases } from './rounded-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<RoundedCases K={K} />);
