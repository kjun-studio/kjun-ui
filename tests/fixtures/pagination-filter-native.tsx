import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { PaginationFilterCases } from './pagination-filter-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><PaginationFilterCases K={K} /></K.KjunProvider>);
