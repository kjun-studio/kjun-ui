import { createRoot } from 'react-dom/client';
import * as K from '@kjun/native';
import { AccordionDesignCases } from './accordion-design-cases';
import { setupAccordionColors, accordionColors } from './accordion-design-data';
setupAccordionColors();
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={accordionColors} fontFamily="Arial"><AccordionDesignCases K={K} /></K.KjunProvider>);
