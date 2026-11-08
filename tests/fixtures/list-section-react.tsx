import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListSectionCases, ListSectionReviewCases } from './list-section-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListSectionCases K={K} /><ListSectionReviewCases K={K} /></K.KjunProvider>);
