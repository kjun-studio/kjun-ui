import { createRoot } from 'react-dom/client';
import * as K from '@kjun-ui/native';
import { demoPalettes, demoDomainPalettes, demoFont } from '../../shared/demo-colors';
import { palette, auditColors } from './visual-reaudit-cases';
import { AuditCases } from './visual-reaudit-common';
createRoot(document.getElementById('root')!).render(<K.KjunProvider colors={{ ...demoPalettes[palette], ...auditColors }} domainColors={demoDomainPalettes[palette]} fontFamily={demoFont}><AuditCases K={K} native /></K.KjunProvider>);
