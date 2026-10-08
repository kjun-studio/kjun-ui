import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { ToggleCases } from './icon-toggle-cases';
import { appColors } from './style-values';
import { domainColors, setup } from './icon-toggle-values';
setup();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={appColors} domainColors={domainColors}><ToggleCases K={K} native /></K.KjunProvider>);
