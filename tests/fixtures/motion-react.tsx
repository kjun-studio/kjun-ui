import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as api from '@kjun-ui/react';
import { setRootValues } from './style-values';
import { MotionCases } from './motion-cases';
setRootValues(); document.documentElement.style.setProperty('--kjun-font', 'Arial');
createRoot(document.getElementById('root')!).render(<StrictMode><api.KjunProvider><api.KjunFeedbackProvider><MotionCases api={api} /></api.KjunFeedbackProvider></api.KjunProvider></StrictMode>);
