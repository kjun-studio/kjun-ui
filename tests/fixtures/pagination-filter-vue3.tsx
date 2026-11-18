import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
import { statusOptions } from './pagination-filter-options';
applyDemoColors('default');
// The same cases as pagination-filter-cases.tsx, in Vue.
const s = reactive({ c: { layout: 'auto', disabled: false, page: 1, pageSize: 20, filter: 'done' } as any, log: [] as number[] });
Object.assign(window, { configureCases: (next: object) => { s.c = { ...s.c, ...next }; } });
const go = (page: number) => { s.log.push(page); s.c = { ...s.c, page }; };
createApp(defineComponent(() => () => <K.KjunProvider><div style={{ padding: '24px', width: '720px' }}>
  <div data-testid="pagination">
    <K.KjunPagination page={s.c.page} totalPages={1000} totalRows={19990} pageSize={s.c.pageSize} showInfo showSizeSelector layout={s.c.layout} disabled={s.c.disabled}
      formatter={(n: number) => n.toLocaleString('en-US')} onUpdate:page={go}
      onUpdate:pageSize={(pageSize: number) => { s.c = { ...s.c, pageSize }; }} />
  </div>
  <output data-testid="log">{s.log.join(',')}</output>
  <div data-testid="filters" style={{ width: '240px' }}>
    <K.KjunFilterGroup ariaLabel="상태 필터" scroll modelValue={s.c.filter} options={statusOptions}
      onUpdate:modelValue={(filter: unknown) => { s.c = { ...s.c, filter }; }} />
  </div>
</div></K.KjunProvider>)).mount('#root');
