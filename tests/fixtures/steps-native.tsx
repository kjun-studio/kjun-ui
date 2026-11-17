import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { StepsCases } from './steps-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<StepsCases K={K} native providerProps={{ colors: demoPalettes.default, domainColors: demoDomainPalettes.default, fontFamily: demoFont }} />);
