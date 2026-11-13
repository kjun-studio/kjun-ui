import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { TableReorderCases } from './table-reorder-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<TableReorderCases K={K} />);
