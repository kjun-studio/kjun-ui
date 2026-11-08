import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';
import { ListSectionCases, ListSectionReviewCases, ListSectionSelectionCases } from './list-section-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><ListSectionCases K={K} native /><ListSectionReviewCases K={K} native /><ListSectionSelectionCases K={K} native /></K.KjunProvider>);
