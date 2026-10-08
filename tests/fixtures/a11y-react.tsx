import { createRoot } from 'react-dom/client';
import * as ui from '@kjun/react';
import { setRootValues } from './style-values';
import { AccessibilityCase } from './a11y-cases';
setRootValues();
createRoot(document.getElementById('root')!).render(<ui.KjunProvider><AccessibilityCase ui={ui} /></ui.KjunProvider>);
