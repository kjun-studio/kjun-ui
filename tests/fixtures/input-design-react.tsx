import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { InputDesignCases, setInputDesignColors } from './input-design-cases';
setInputDesignColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider><InputDesignCases K={K} /></K.KjunProvider>);
