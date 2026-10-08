import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsButtonGroup } from '@kjun/react';
import { setRootValues } from './style-values';
import { ButtonGroupCases } from './button-group-cases';
setRootValues();
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider><ButtonGroupCases Group={DsButtonGroup} /></KjunProvider></StrictMode>);
