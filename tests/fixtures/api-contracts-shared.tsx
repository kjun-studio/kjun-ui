import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { scopedColors, scopedFont, setRootValues } from './style-values';
const rows = [{ id: 'a', name: 'Alpha', amount: 20 }, { id: 'b', name: 'Beta', amount: 10 }];
const w = window as any;
const log = (name: string, value?: unknown) => w.contractEvents.push({ name, value });
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) => {
  log('request', query);
  signal.addEventListener('abort', () => log('abort', query));
  return new Promise((resolve, reject) => setTimeout(() => query === 'fail' ? reject(new Error('request failed')) : resolve([{ id: query, name: query + ' result' }]), query === 'slow' ? 900 : 30));
};
export function mountContracts(K: any, native: boolean) {
  setRootValues(); w.contractEvents = [];
  const root = createRoot(document.getElementById('root')!);
  w.unmountContract = () => root.unmount();
  const scenario = new URLSearchParams(location.search).get('scenario') || 'select';
  const copyButtons = () => <div style={{ display: 'flex', gap: 12 }}>
    <K.DsCopyButton ariaLabel="복사 성공" value="success" text="복사" successText="복사 완료" copyText={async () => {}} />
    <K.DsCopyButton ariaLabel="복사 실패" value="failure" text="복사" successText="복사 완료" copyText={async () => { throw new Error('clipboard failed'); }} />
  </div>;
  function Content() {
    const [value, setValue] = useState<any>(null), [selected, setSelected] = useState<any[]>([]);
    const [query, setQuery] = useState(''), [options, configure] = useState<any>({ queryKey: 'a', resultKey: null, loading: true, preserveContent: true });
    w.configureContract = (next: any) => configure((old: any) => ({ ...old, ...next }));
    w.feedbackContract = K.useKjunFeedback();
    const button = (label: string, callback: () => void) => <K.DsButton {...{ [native ? 'onPress' : 'onClick']: callback }}>{label}</K.DsButton>;
    let content;
    if (scenario.startsWith('select')) content = <K.DsSelect ariaLabel="계약 선택" value={value} options={[{ value: 'a', label: 'Alpha', base: 'BTC' }, { value: 'b', label: 'Beta' }]} {...(scenario === 'select-fixed' ? { open: false } : {})} searchable={scenario === 'select-search'} renderSelected={(option: any) => { w.selectedSlot = option || null; return null; }} clearable={scenario !== 'select-defaults'} multiple={scenario === 'select-multiple'} onValueChange={(v: any) => { log('value', v); setValue(v); }} onChange={(v: any) => log('change', v)} onClear={() => log('clear')} onOpenChange={(v: boolean) => log('open', v)} />;
    if (scenario === 'table') content = <K.DsTable data={rows} columns={[{ key: 'name', label: '이름' }, { key: 'amount', label: '금액', sortable: true }]} responsive="none" searchable selectable selected={selected} expandable expandedRows={[]} onSelectionChange={(v: any[]) => { log('selected', v); setSelected(v); }} onExpandedRowsChange={(v: any) => log('expanded', v)} onSortChange={(v: any) => log('sort', v)} onSearch={(v: string) => log('search', v)} renderCell={(value: any, column: any, row: any, index: number) => { w.cellContract = { value, column, row, index }; return String(value); }} renderExpand={(row: any) => <span>상세 {row.id}</span>} renderSelectionToolbar={(selection: any[]) => <span>{selection.length}개 선택 계약</span>} />;
    if (scenario === 'search') content = <K.DsSearchInput ariaLabel="계약 검색" value={query} loadOptions={loadOptions} debounce={10000} onValueChange={setQuery} onSearchError={(error: Error) => log('error', error.message)} onSelect={(value: any) => log('select', value)} />;
    if (scenario === 'data-state') content = <K.DsDataState {...options} onRetry={() => log('retry')}><span>현재 결과</span></K.DsDataState>;
    if (scenario === 'form') content = <K.DsFormGroup label="계약 필드" id="contract-field" hint="필드 도움말" error={options.error} required><K.DsInput value={query} {...{ [native ? 'onChangeText' : 'onValueChange']: setQuery }} /></K.DsFormGroup>;
    if (scenario === 'feedback') content = button('서비스 준비', () => {});
    if (scenario === 'copy') content = copyButtons();
    return <div style={{ padding: 24, maxWidth: 950 }}>{content}</div>;
  }
  root.render(<K.KjunProvider {...(native ? { colors: scopedColors(false), fontFamily: scopedFont(false) } : {})}>{scenario === 'copy-standalone' ? copyButtons() : <K.KjunFeedbackProvider><Content /></K.KjunFeedbackProvider>}</K.KjunProvider>);
}
