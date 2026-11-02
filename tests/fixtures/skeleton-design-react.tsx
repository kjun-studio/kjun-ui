import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { SkeletonDesignCases } from './skeleton-design-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><SkeletonDesignCases K={K} /></K.KjunProvider>);
