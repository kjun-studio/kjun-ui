import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { FileUploadCases } from './file-upload-cases';
applyDemoColors('default');
createRoot(document.getElementById('root')!).render(<FileUploadCases K={K} />);
