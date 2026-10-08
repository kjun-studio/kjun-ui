import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, DsButton } from '@kjun/react';
import { ButtonDesignCases, setButtonColors } from './button-design-cases';
setButtonColors();
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider><ButtonDesignCases Button={DsButton} /></KjunProvider></StrictMode>);
