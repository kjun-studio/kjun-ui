import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { ParityCases } from './parity-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<ParityCases K={K} native providerProps={{ colors: demoPalettes.default, domainColors: demoDomainPalettes.default, fontFamily: demoFont }} />);
