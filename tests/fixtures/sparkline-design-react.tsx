import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { SparklineDesignCases } from './sparkline-design-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><SparklineDesignCases K={K} /></K.KjunProvider>);
