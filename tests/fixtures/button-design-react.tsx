import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunButton } from '@kjun-ui/react';
import { ButtonDesignCases, setButtonColors } from './button-design-cases';
setButtonColors();
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider><ButtonDesignCases Button={KjunButton} /></KjunProvider></StrictMode>);
