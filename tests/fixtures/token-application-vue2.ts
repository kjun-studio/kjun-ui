import Vue from 'vue';
import { KjunProvider, DsTable, DsButton, DsInput } from '@kjun-ui/vue2';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
new Vue({ render(h) { return h(KjunProvider, [
  ...[false,true].map(compact => h('div', { attrs: { 'data-testid': compact ? 'compact' : 'regular' } }, [h(DsTable, { props: { compact, responsive: 'none', columns: [{ key: 'name', label: '이름' }], data: [{ id: 1, name: '문서' }] } })])),
  h('div', { attrs: { 'data-testid': 'button' } }, [h(DsButton, '확인')]),
  h('div', { attrs: { 'data-testid': 'input' } }, [h(DsInput, { props: { ariaLabel: '입력' } })]),
]); } }).$mount('#root');
