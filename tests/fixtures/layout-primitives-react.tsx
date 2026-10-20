import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { boxCss } from './layout-primitives-values';
import { LayoutCases } from './layout-primitives-cases';
applyDemoColors('default');
document.head.append(Object.assign(document.createElement('style'), { textContent: boxCss }));
createRoot(document.getElementById('root')!).render(<K.KjunProvider><LayoutCases K={K} /></K.KjunProvider>);
