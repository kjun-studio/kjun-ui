import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { IconRenderCases } from './icon-render-cases';
import { setup } from './icon-toggle-values';
setup();
createRoot(document.getElementById('root')!).render(<IconRenderCases K={K} />);
