import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { setRootValues } from './style-values';
import { hero } from './kpi-secondary-values';
setRootValues();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><div style={{ padding: 16 }}><K.KjunKpiHero {...hero} /></div></K.KjunProvider>);
