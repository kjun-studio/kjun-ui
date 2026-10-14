import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunButton } from '@kjun-ui/native';
import { ButtonDesignCases, buttonColors } from './button-design-cases';
createRoot(document.getElementById('root')!).render(<StrictMode><KjunProvider colors={buttonColors}><ButtonDesignCases Button={KjunButton} native /></KjunProvider></StrictMode>);
