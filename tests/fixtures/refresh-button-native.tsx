import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { RefreshButtonCases } from './refresh-button-cases';
applyDemoColors(location.search.includes('dark') ? 'dark' : 'default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes[location.search.includes('dark') ? 'dark' : 'default']} fontFamily={demoFont}><RefreshButtonCases K={K} /></K.KjunProvider>);
