import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { CarouselCases } from './carousel-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<CarouselCases K={K} />);
