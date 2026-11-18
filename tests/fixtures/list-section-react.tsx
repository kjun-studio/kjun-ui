import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListSectionCases, ListSectionReviewCases, ListSectionSelectionCases, ListSectionBadgeCases } from './list-section-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListSectionCases K={K} /><ListSectionReviewCases K={K} /><ListSectionSelectionCases K={K} /><ListSectionBadgeCases K={K} /></K.KjunProvider>);
