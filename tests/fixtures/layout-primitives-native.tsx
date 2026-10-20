import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { boxCss } from './layout-primitives-values';
import { LayoutCases } from './layout-primitives-cases';
applyDemoColors('default');
document.head.append(Object.assign(document.createElement('style'), { textContent: boxCss }));
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} domainColors={demoDomainPalettes.default} fontFamily={demoFont}><LayoutCases K={K} native /></K.KjunProvider>);
