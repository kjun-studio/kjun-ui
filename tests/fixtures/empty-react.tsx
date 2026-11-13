import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { EmptyCases } from './empty-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><EmptyCases K={K} web /></K.KjunProvider>);
