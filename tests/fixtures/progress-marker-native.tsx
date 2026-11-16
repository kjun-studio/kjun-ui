import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import * as K from '@kjun-ui/native';
import { ProgressMarkerCases, demoFont, demoPalettes } from './progress-marker-cases';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><ProgressMarkerCases K={K} Box={View} /></K.KjunProvider>);
