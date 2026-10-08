import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { RefreshButtonCases } from './refresh-button-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider><RefreshButtonCases K={K} /></K.KjunProvider>);
