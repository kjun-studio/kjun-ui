import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues();
const rows = [{ id: 3, name: 'Three', amount: 30 }, { id: 1, name: 'One', amount: 10 }, { id: 2, name: 'Two', amount: 20 }];
const initial = {
  value: 2, open: false, disabled: false, accept: true,
  layerKind: 'modal', closeOnEsc: true, showHeader: true, dialogTitle: 'Editor',
  dialogLabel: undefined as string | undefined, customHeader: false,
  label: 'Order quantity', hint: 'Quantity hint', error: '', required: true,
  inputId: undefined as string | undefined, ariaLabel: undefined as string | undefined,
  data: rows, controlled: false, sort: null as null | { key: string; order: 'asc' | 'desc' },
  sortMode: 'client', sortable: true, rowAction: true,
  searchable: false, show: true, controlledExpansion: false, expanded: [] as (string | number)[], expandSingle: false,
  responsive: 'card', maxHeight: undefined as number | undefined,
};
const config = reactive({ ...initial });
const events = ref<unknown[]>([]), selected = ref<object[]>([]);
const update = (next: Partial<typeof initial>) => Object.assign(config, next);
const emit = (name: string, value?: unknown) => events.value.push([name, value]);
Object.assign(window, { configureReview: update, resetReviewEvents: () => { events.value = []; } });
const button = (label: string, click: () => void) => <K.KjunButton onClick={click}>{label}</K.KjunButton>;
const text = (value: string, id?: string) => <span data-testid={id}>{value}</span>;
const table = location.search.includes('table');
const Cases = defineComponent(() => () => {
  const Layer: any = config.layerKind === 'drawer' ? K.KjunDrawer : K.KjunModal;
  return <>
    {table ? config.show && <K.KjunTable data={config.data} columns={[
      { key: 'name', label: 'Name', render: (_: unknown, row: any) => text(row.name, 'row-' + row.id) },
      { key: 'amount', label: 'Amount', sortable: true },
      { key: 'actions', label: 'Actions', render: () => button('Action', () => emit('action')) },
    ]} responsive={config.responsive as any} searchable={config.searchable} onSearch={(q: string) => emit('search', q)} maxHeight={config.maxHeight}
      expandedRows={config.controlledExpansion ? config.expanded : undefined} expandSingle={config.expandSingle}
      onUpdate:expandedRows={(keys: (string | number)[]) => { emit('expanded', keys); if (config.accept) update({ expanded: keys }); }}
      selectable selected={selected.value} onUpdate:selected={(rows: object[]) => { selected.value = rows; }} expandable
      sort={config.controlled ? config.sort : undefined} sortMode={config.sortMode as any} sortable={config.sortable}
      onUpdate:sort={(sort: any) => { emit('sort', sort); if (config.accept) update({ sort }); }}
      onRowClick={config.rowAction ? (row: any, index: number) => emit('row', [row.id, index]) : undefined}>
      {{ expand: ({ row }: any) => text('Detail ' + row.id) }}
    </K.KjunTable> : <>
      {button('Open', () => update({ open: true }))}
      <Layer open={config.open} onUpdate:open={(open: boolean) => update({ open })} title={config.dialogTitle}
        closeOnEsc={config.closeOnEsc} showHeader={config.showHeader} ariaLabel={config.dialogLabel}>
        {{
          default: () => <>
            <K.KjunFormGroup id="quantity-field" label={config.label} hint={config.hint} error={config.error} required={config.required}>
              <K.KjunQuantityStepper modelValue={config.value} disabled={config.disabled} id={config.inputId} ariaLabel={config.ariaLabel}
                onUpdate:modelValue={(value: number) => { emit('value', value); if (config.accept) update({ value }); }}
                onChange={(value: number) => emit('commit', value)} onInvalid-input={(draft: string) => emit('invalid', draft)} />
            </K.KjunFormGroup>
            {button('Other field', () => {})}
          </>,
          ...(config.customHeader ? { header: () => text('Custom heading') } : {}),
        }}
      </Layer>
    </>}
    <output data-testid="selected">{JSON.stringify(selected.value)}</output>
    <output data-testid="model">{JSON.stringify(config)}</output>
    <output data-testid="events">{JSON.stringify(events.value)}</output>
  </>;
});
createApp(defineComponent(() => () => location.search.includes('unscoped') ? <Cases /> : <K.KjunProvider><Cases /></K.KjunProvider>)).mount('#root');
