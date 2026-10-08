import { createRoot } from 'react-dom/client';
import { KjunProvider, DsTable, DsButton, DsInput } from '@kjun/react';
import { applyDemoColors, demoPalettes } from '../../shared/demo-colors';
applyDemoColors('default');
const columns = [{ key: 'name', label: '이름' }], data = [{ id: 1, name: '문서' }];
createRoot(document.getElementById('root')!).render(<KjunProvider >
  {[false, true].map(compact => <div key={String(compact)} data-testid={compact ? 'compact' : 'regular'}><DsTable columns={columns} data={data} compact={compact} responsive="none" /></div>)}
  <div data-testid="button"><DsButton>확인</DsButton></div>
  <div data-testid="input"><DsInput ariaLabel="입력" /></div>
</KjunProvider>);
