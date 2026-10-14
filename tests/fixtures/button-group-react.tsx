import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunButtonGroup } from '@kjun-ui/react';
import { setRootValues } from './style-values';
import { ButtonGroupCases } from './button-group-cases';
setRootValues();
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider><ButtonGroupCases Group={KjunButtonGroup} /></KjunProvider></StrictMode>);
