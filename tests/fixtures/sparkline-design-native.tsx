import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoDomainPalettes, demoFont, demoPalettes } from '../../shared/demo-colors';
import { SparklineDesignCases } from './sparkline-design-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><SparklineDesignCases K={K} /></K.KjunProvider>);
