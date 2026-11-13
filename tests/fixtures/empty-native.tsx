import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { EmptyCases } from './empty-cases';
const palette = location.search.includes('dark') ? 'dark' : 'default';
applyDemoColors(palette);
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes[palette]} domainColors={demoDomainPalettes[palette]} fontFamily={demoFont}><EmptyCases K={K} web={false} /></K.KjunProvider>);
