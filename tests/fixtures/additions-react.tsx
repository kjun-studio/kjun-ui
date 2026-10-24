import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { AdditionCases } from './additions-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<AdditionCases K={K} />);
