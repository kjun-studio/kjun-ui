import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListDetailsCases } from './list-details-cases';

applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><ListDetailsCases K={K} /></K.KjunProvider>);
