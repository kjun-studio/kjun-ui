import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { PressTitleCases } from './press-title-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<PressTitleCases K={K} native providerProps={{ colors: demoPalettes.default, fontFamily: demoFont }} />);
