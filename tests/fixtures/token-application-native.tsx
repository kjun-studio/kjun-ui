import { createRoot } from 'react-dom/client';
import { KjunProvider, KjunTable, KjunButton, KjunInput } from '@kjun-ui/native';
import { applyDemoColors, demoPalettes } from '../../shared/demo-colors';
applyDemoColors('default');
const columns = [{ key: 'name', label: '이름' }], data = [{ id: 1, name: '문서' }];
createRoot(document.getElementById('root')!).render(<KjunProvider colors={demoPalettes.default}>
  {[false, true].map(compact => <div key={String(compact)} data-testid={compact ? 'compact' : 'regular'}><KjunTable columns={columns} data={data} compact={compact} responsive="none" /></div>)}
  <div data-testid="button"><KjunButton>확인</KjunButton></div>
  <div data-testid="input"><KjunInput ariaLabel="입력" /></div>
</KjunProvider>);
