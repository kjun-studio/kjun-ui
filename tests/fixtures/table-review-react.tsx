import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableReviewCases } from './table-review-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><TableReviewCases K={K} /></K.KjunProvider>);
