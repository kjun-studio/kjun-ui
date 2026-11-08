import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListDesignCases, ListOpenCases } from './list-design-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListDesignCases K={K} /><ListOpenCases K={K} /></K.KjunProvider>);
