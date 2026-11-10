import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { ListReorderCases } from './list-reorder-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<ListReorderCases K={K} />);
