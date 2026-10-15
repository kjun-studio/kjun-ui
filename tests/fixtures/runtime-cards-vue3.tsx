import { createApp, defineComponent, reactive } from 'vue';
import { KjunProvider, KjunTable } from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const row = { id: 0, name: 'Zero', code: 'Z', badge: 'Badge', amount: 10, blank: '', control: true };
const s = reactive({ selected: [] as object[], badge: true, responsive: 'card', inlineActions: false, events: [] as string[] });
Object.assign(window, { configureCards: (next: object) => Object.assign(s, next) });
const cell = ({ row, value, index }: any) => <span data-testid={'slot-' + String(value)}>{`${value}:${row.id}:${index}`}</span>;
const button = (label: string) => <button onClick={(event: MouseEvent) => { event.stopPropagation(); s.events.push(label); }}>{label}</button>;
createApp(defineComponent(() => () => <KjunProvider>
  <KjunTable data={[row]} columns={[
    { key: 'name', label: 'Name' }, { key: 'code', label: 'Code' },
    ...(s.badge ? [{ key: 'badge', label: 'Badge', badge: true }] : []),
    { key: 'amount', label: 'Amount', type: 'number' as const },
    { key: 'blank', label: 'Blank', hideEmptyInCard: true },
    { key: 'control', label: 'Control', inlineInCard: true },
    { key: 'actions', label: 'Actions', inlineInCard: s.inlineActions },
  ]} responsive={s.responsive as any} mobileColumns={['name', 'amount']} cardTitle="name" cardSubtitle="code"
    cardSections={[{ key: 'metrics', label: 'Metrics', columns: ['amount', 'blank'], layout: 'metrics' }]}
    selectable selected={s.selected} expandable rowClass={() => 'custom-row'}
    onUpdate:selected={(selected: object[]) => { s.selected = selected; }} onRowClick={() => s.events.push('row')}>
    {{
      'cell-name': cell, 'cell-code': cell, 'cell-badge': cell, 'cell-amount': cell,
      'cell-control': () => button('Toggle'), 'cell-actions': () => button('Action'),
      expand: ({ row, index }: any) => <span>{`Detail:${row.id}:${index}`}</span>,
      selectionToolbar: ({ selected }: any) => <span>{`Selection:${selected[0].id}`}</span>,
    }}
  </KjunTable>
  <output data-testid="events">{JSON.stringify(s.events)}</output>
</KjunProvider>)).mount('#root');
