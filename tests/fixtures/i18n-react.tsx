import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { I18nCases } from './i18n-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<I18nCases K={K} />);
