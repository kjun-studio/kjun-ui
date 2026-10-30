import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ParityCases } from './parity-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<ParityCases K={K} />);
