import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { DropdownStructureCases } from './dropdown-structure-cases';
createRoot(document.getElementById('root')!).render(<DropdownStructureCases K={K} native />);
