import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { MarketCases } from './runtime-market-cases';
import { appColors } from './style-values';
import { demoDomainPalettes } from '../../shared/demo-colors';
const fontFamily = new URLSearchParams(location.search).has('weight-faces')
  ? { 400: 'serif', 500: 'monospace', 600: 'serif', 700: 'serif' } : 'Arial';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={appColors} domainColors={demoDomainPalettes.default} fontFamily={fontFamily}><MarketCases K={K} /></K.KjunProvider>);
