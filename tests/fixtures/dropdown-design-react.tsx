import { createRoot } from 'react-dom/client';
import * as K from '@kjun/react';
import { DropdownDesignCases } from './dropdown-design-cases';
createRoot(document.getElementById('root')!).render(<DropdownDesignCases K={K} />);
