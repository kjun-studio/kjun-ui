import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { DistributionCases } from './distribution-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<DistributionCases K={K} />);
