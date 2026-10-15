import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
const rows = [{ id: 'a', name: 'Alpha', amount: 20 }, { id: 'b', name: 'Beta', amount: 10 }];
const w = window as any;
const log = (name: string, value?: unknown) => w.contractEvents.push({ name, value });
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) => {
  log('request', query);
  signal.addEventListener('abort', () => log('abort', query));
  return new Promise<any>((resolve, reject) => setTimeout(() => query === 'fail' ? reject(new Error('request failed')) : resolve([{ id: query, name: query + ' result' }]), query === 'slow' ? 900 : 30));
};
setRootValues(); w.contractEvents = [];
const scenario = new URLSearchParams(location.search).get('scenario') || 'select';
const copyButtons = () => <div style={{ display: 'flex', gap: '12px' }}>
  <K.KjunCopyButton ariaLabel="복사 성공" value="success" text="복사" successText="복사 완료" copyText={async () => {}} />
  <K.KjunCopyButton ariaLabel="복사 실패" value="failure" text="복사" successText="복사 완료" copyText={async () => { throw new Error('clipboard failed'); }} />
</div>;
const Content = defineComponent(() => {
  const s = reactive({ value: null as any, selected: [] as any[], query: '', options: { queryKey: 'a', resultKey: null, loading: true, preserveContent: true } as any });
  w.configureContract = (next: any) => { s.options = { ...s.options, ...next }; };
  w.feedbackContract = K.useKjunFeedback();
  return () => {
    let content: any = null;
    if (scenario.startsWith('select')) content = <K.KjunSelect ariaLabel="계약 선택" modelValue={s.value} options={[{ value: 'a', label: 'Alpha', base: 'BTC' }, { value: 'b', label: 'Beta' }]}
      {...(scenario === 'select-fixed' ? { open: false } : {})} searchable={scenario === 'select-search'} clearable={scenario !== 'select-defaults'} multiple={scenario === 'select-multiple'}
      onUpdate:modelValue={(v: any) => { log('value', v); s.value = v; }} onChange={(v: any) => log('change', v)} onClear={() => log('clear')} onUpdate:open={(v: boolean) => log('open', v)}>
      {{ selected: ({ option }: any) => { w.selectedSlot = option || null; return null; } }}
    </K.KjunSelect>;
    if (scenario === 'table') content = <K.KjunTable data={rows} columns={[{ key: 'name', label: '이름' }, { key: 'amount', label: '금액', sortable: true }]} responsive="none" searchable selectable selected={s.selected} expandable expandedRows={[]}
      onUpdate:selected={(v: any[]) => { log('selected', v); s.selected = v; }} onUpdate:expandedRows={(v: any) => log('expanded', v)} onUpdate:sort={(v: any) => log('sort', v)} onSearch={(v: string) => log('search', v)}>
      {{
        cell: ({ value, column, row, index }: any) => { w.cellContract = { value, column, row, index }; return String(value); },
        expand: ({ row }: any) => <span>상세 {row.id}</span>,
        selectionToolbar: ({ selected }: any) => <span>{selected.length}개 선택 계약</span>,
      }}
    </K.KjunTable>;
    if (scenario === 'data-state') content = <K.KjunDataState {...s.options} onRetry={() => log('retry')}><span>현재 결과</span></K.KjunDataState>;
    if (scenario === 'search') content = <K.KjunSearchInput ariaLabel="계약 검색" modelValue={s.query} loadOptions={loadOptions} debounce={10000}
      onUpdate:modelValue={(v: string) => s.query = v} onSearch-error={(error: Error) => log('error', error.message)} onSelect={(v: any) => log('select', v)} />;
    if (scenario === 'form') content = <K.KjunFormGroup label="계약 필드" id="contract-field" hint="필드 도움말" error={s.options.error} required>
      <K.KjunInput modelValue={s.query} onUpdate:modelValue={(v: string) => s.query = v} />
    </K.KjunFormGroup>;
    if (scenario === 'feedback') content = <K.KjunButton>서비스 준비</K.KjunButton>;
    if (scenario === 'copy') content = copyButtons();
    return <div style={{ padding: '24px', maxWidth: '950px' }}>{content}</div>;
  };
});
const app = createApp(defineComponent(() => () => <K.KjunProvider>{scenario === 'copy-standalone' ? copyButtons() : <K.KjunFeedbackProvider><Content /></K.KjunFeedbackProvider>}</K.KjunProvider>));
w.unmountContract = () => app.unmount();
app.mount('#root');
