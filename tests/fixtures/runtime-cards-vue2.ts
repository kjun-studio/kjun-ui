import Vue from 'vue';
import { KjunProvider, DsTable } from '@kjun/vue2';
import { setRootValues } from './style-values';
setRootValues();
const row = { id: 0, name: 'Zero', code: 'Z', badge: 'Badge', amount: 10, blank: '', control: true };
const vm = new Vue({
  data: () => ({ selected: [] as typeof row[], badge: true, responsive: 'card', inlineActions: false, events: [] as string[] }),
  render(h) {
    const cell = ({ row, value, index }: any) => h('span', { attrs: { 'data-testid': 'slot-' + String(value) } }, `${value}:${row.id}:${index}`);
    const button = (label: string) => h('button', { on: { click: (event: Event) => { event.stopPropagation(); this.events.push(label); } } }, label);
    return h(KjunProvider, [h(DsTable, {
      props: {
        data: [row], columns: [
          { key: 'name', label: 'Name' }, { key: 'code', label: 'Code' },
          ...(this.badge ? [{ key: 'badge', label: 'Badge', badge: true }] : []),
          { key: 'amount', label: 'Amount', type: 'number' },
          { key: 'blank', label: 'Blank', hideEmptyInCard: true },
          { key: 'control', label: 'Control', inlineInCard: true },
          { key: 'actions', label: 'Actions', inlineInCard: this.inlineActions },
        ],
        responsive: this.responsive, mobileColumns: ['name', 'amount'], cardTitle: 'name', cardSubtitle: 'code',
        cardSections: [{ key: 'metrics', label: 'Metrics', columns: ['amount', 'blank'], layout: 'metrics' }],
        selectable: true, selected: this.selected, expandable: true, rowClass: () => 'custom-row',
      },
      on: { 'selection-change': (selected: typeof row[]) => { this.selected = selected; }, 'row-click': () => this.events.push('row') },
      scopedSlots: {
        'cell-name': cell, 'cell-code': cell, 'cell-badge': cell, 'cell-amount': cell,
        'cell-control': () => button('Toggle'), 'cell-actions': () => button('Action'),
        expand: ({ row, index }: any) => h('span', `Detail:${row.id}:${index}`),
        'selection-toolbar': ({ selected }: any) => h('span', `Selection:${selected[0].id}`),
      },
    }), h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events))]);
  },
}).$mount('#root');
Object.assign(window, { configureCards: (next: object) => Object.assign(vm, next) });
