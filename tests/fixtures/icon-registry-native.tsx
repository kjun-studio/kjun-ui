import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { RegistryCases } from './icon-registry-cases';
import { setup } from './icon-toggle-values';
setup();
createRoot(document.getElementById('root')!).render(<RegistryCases K={K} native />);
