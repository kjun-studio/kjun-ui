import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { AdoptionCases } from './adoption-cases';
applyDemoColors('default');
const feedback = K.createKjunFeedback();
function openFromFunction() { void feedback.confirm({ message: 'Opened from a function' }); feedback.toast.info('Toast from a function', { duration: 0 }); }
createRoot(document.getElementById('root')!).render(<AdoptionCases K={K} native feedback={feedback} openFromFunction={openFromFunction} providerProps={{ colors: demoPalettes.default, domainColors: demoDomainPalettes.default, fontFamily: demoFont }} />);
