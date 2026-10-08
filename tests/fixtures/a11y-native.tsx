import { createRoot } from 'react-dom/client';
import * as ui from '@kjun-ui/native';
import { scopedColors } from './style-values';
import { AccessibilityCase } from './a11y-cases';
createRoot(document.getElementById('root')!).render(<ui.KjunProvider colors={scopedColors(false)}><AccessibilityCase ui={ui} native /></ui.KjunProvider>);
