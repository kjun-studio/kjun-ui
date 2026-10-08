import Vue from 'vue';
import plugin, * as K from '@kjun/vue2';
import { setRootValues } from './style-values';
Vue.use(plugin); setRootValues();
const w = window as any; w.contractEvents = [];
const log = (name: string, value?: unknown) => w.contractEvents.push({ name, value });
const rows = [{ id: 'a', name: 'Alpha', amount: 20 }, { id: 'b', name: 'Beta', amount: 10 }];
const scenario = new URLSearchParams(location.search).get('scenario') || 'select';
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) => {
  log('request', query); signal.addEventListener('abort', () => log('abort', query));
  return new Promise((resolve, reject) => setTimeout(() => query === 'fail' ? reject(new Error('request failed')) : resolve([{ id: query, name: query + ' result' }]), query === 'slow' ? 900 : 30));
};
const Content = Vue.extend({
  inject: { kjunFeedback: { default: null } },
  data: () => ({ value: null as any, selected: [] as any[], query: '', options: { queryKey: 'a', resultKey: null, loading: true, preserveContent: true } as any }),
  mounted() { w.feedbackContract = (this as any).kjunFeedback; w.configureContract = (next: any) => { this.options = { ...this.options, ...next }; }; },
  render(h) {
    let content;
    if (scenario.startsWith('select')) content = h(K.DsSelect, { props: { ariaLabel: '계약 선택', value: this.value, options: [{ value: 'a', label: 'Alpha', base: 'BTC' }, { value: 'b', label: 'Beta' }], ...(scenario === 'select-fixed' ? { open: false } : {}), searchable: scenario === 'select-search', clearable: scenario !== 'select-defaults', multiple: scenario === 'select-multiple' }, on: { input: (v: any) => { log('value', v); this.value = v; }, change: (v: any) => log('change', v), clear: () => log('clear'), 'update:open': (v: boolean) => log('open', v) }, scopedSlots: { selected: ({ option, label }: any) => { w.selectedSlot = option; return h('span', label || '선택'); } } });
    if (scenario === 'table') content = h(K.DsTable, { props: { data: rows, columns: [{ key: 'name', label: '이름' }, { key: 'amount', label: '금액', sortable: true }], responsive: 'none', searchable: true, selectable: true, selected: this.selected, expandable: true, expandedRows: [] }, on: { 'selection-change': (v: any[]) => { log('selected', v); this.selected = v; }, 'update:expandedRows': (v: any) => log('expanded', v), 'sort-change': (v: any) => log('sort', v), search: (v: string) => log('search', v) }, scopedSlots: { 'cell-name': ({ value, row, index }: any) => { w.cellContract = { value, row, index }; return h('span', String(value)); }, expand: ({ row }: any) => h('span', '상세 ' + row.id), 'selection-toolbar': ({ selected }: any) => h('span', selected.length + '개 선택 계약') } });
    if (scenario === 'search') content = h(K.DsSearchInput, { props: { ariaLabel: '계약 검색', value: this.query, loadOptions, debounce: 10000 }, on: { input: (v: string) => { this.query = v; }, 'search-error': (error: Error) => log('error', error.message), select: (v: any) => log('select', v) } });
    if (scenario === 'data-state') content = h(K.DsDataState, { props: this.options, on: { retry: () => log('retry') }, scopedSlots: { error: ({ error, retry }: any) => { w.errorSlotContract = { error, retryType: typeof retry }; return h('div', [h('span', error), h(K.DsButton, { on: { click: retry } }, '슬롯 재시도')]); } } }, [h('span', '현재 결과')]);
    if (scenario === 'form') content = h(K.DsFormGroup, { props: { label: '계약 필드', id: 'contract-field', hint: '필드 도움말', error: this.options.error, required: true } }, [h(K.DsInput, { props: { value: this.query }, on: { input: (v: string) => { this.query = v; } } })]);
    if (scenario === 'feedback') content = h(K.DsButton, '서비스 준비');
    if (scenario === 'copy' || scenario === 'copy-standalone') content = h('div', { style: { display: 'flex', gap: '12px' } }, [
      h(K.DsCopyButton, { props: { ariaLabel: '복사 성공', value: 'success', text: '복사', successText: '복사 완료', copyText: async () => {} } }),
      h(K.DsCopyButton, { props: { ariaLabel: '복사 실패', value: 'failure', text: '복사', successText: '복사 완료', copyText: async () => { throw new Error('clipboard failed'); } } }),
    ]);
    return h('div', { style: { padding: '24px', maxWidth: '950px' } }, [content]);
  },
});
const app = new Vue({ render: h => h(K.KjunProvider, [scenario === 'copy-standalone' ? h(Content) : h(K.KjunFeedbackProvider, [h(Content)])]) }).$mount('#root');
w.unmountContract = () => {
  app.$destroy();
  // Vue's root destroy releases the instance; its mount owner removes the DOM.
  app.$el.remove();
};
