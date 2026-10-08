import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as api from '@kjun/native';
import { appColors } from './style-values';
import { MotionCases } from './motion-cases';
createRoot(document.getElementById('root')!).render(<StrictMode><api.KjunProvider colors={appColors} fontFamily="Arial"><api.KjunFeedbackProvider><MotionCases api={api} /></api.KjunFeedbackProvider></api.KjunProvider></StrictMode>);
