import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { AlertCases } from './alert-design-cases';
const palette = location.search.includes('dark') ? 'dark' : 'default';
applyDemoColors(palette);
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes[palette]} fontFamily={demoFont}><AlertCases K={K} /></K.KjunProvider>);
