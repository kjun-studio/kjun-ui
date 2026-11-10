import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { SplitPaneCases } from './split-pane-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<SplitPaneCases K={K} />);
