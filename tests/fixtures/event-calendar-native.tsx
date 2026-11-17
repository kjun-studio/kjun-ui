import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes } from '../../shared/demo-colors';
import { EventCalendarCases } from './event-calendar-cases';
// The React cases with the Native package: the provider takes the same palette the page sets as --kjun-* values, which the spec reads back.
applyDemoColors('default');
document.body.style.margin = '0';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={demoPalettes.default} fontFamily={demoFont}><EventCalendarCases K={K} /></K.KjunProvider>);
