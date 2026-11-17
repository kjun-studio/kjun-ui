import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { EventCalendarCases } from './event-calendar-cases';
applyDemoColors('default');
document.body.style.margin = '0';
createRoot(document.getElementById('root')!).render(<K.KjunProvider><EventCalendarCases K={K} /></K.KjunProvider>);
