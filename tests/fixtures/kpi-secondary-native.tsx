import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunKpiHero } from '@kjun-ui/native';
import { palette, demoFont } from './typography-values';
import { hero } from './kpi-secondary-values';
createRoot(document.getElementById('root')!).render(<KjunProvider colors={palette(false)} fontFamily={demoFont}><div style={{ padding: 16 }}><KjunKpiHero {...hero} /></div></KjunProvider>);
