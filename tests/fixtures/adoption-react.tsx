import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { AdoptionCases } from './adoption-cases';
applyDemoColors('default');
// Created at module level, outside every component, like an app's actions file.
const feedback = K.createKjunFeedback();
function openFromFunction() { void feedback.confirm({ message: 'Opened from a function' }); feedback.toast.info('Toast from a function', { duration: 0 }); }
createRoot(document.getElementById('root')!).render(<AdoptionCases K={K} feedback={feedback} openFromFunction={openFromFunction} />);
