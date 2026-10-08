import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/react';
import { applyDemoColors } from '../../shared/demo-colors';
import { palette, auditColors } from './visual-reaudit-cases';
import { AuditCases } from './visual-reaudit-common';
applyDemoColors(palette);
for (const [key, value] of Object.entries(auditColors)) document.documentElement.style.setProperty('--kjun-' + key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value);
createRoot(document.getElementById('root')!).render(<K.KjunProvider><AuditCases K={K} /></K.KjunProvider>);
