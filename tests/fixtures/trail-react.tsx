import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TrailCases } from './trail-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<TrailCases K={K} />);
