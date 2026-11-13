import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { applyDemoColors, demoFont, demoPalettes, demoDomainPalettes } from '../../shared/demo-colors';
import { TableReorderCases } from './table-reorder-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<TableReorderCases K={K} providerProps={{ colors: demoPalettes.default, domainColors: demoDomainPalettes.default, fontFamily: demoFont }} />);
