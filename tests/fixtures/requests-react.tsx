import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { RequestsCases } from './requests-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<RequestsCases K={K} />);
