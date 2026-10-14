import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunButtonGroup } from '@kjun-ui/native';
import { appColors } from './style-values';
import { ButtonGroupCases } from './button-group-cases';
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider colors={appColors}><ButtonGroupCases Group={KjunButtonGroup} /></KjunProvider></StrictMode>);
