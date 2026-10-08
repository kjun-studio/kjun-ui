import { useState } from "react";
import { Text } from "react-native";

export const rows = [{ id: 3, name: "Three", amount: 30 }, { id: 1, name: "One", amount: 10 }, { id: 2, name: "Two", amount: 20 }];
export const initial = {
  value: 2, open: false, disabled: false, accept: true,
  layerKind: 'modal', closeOnEsc: true, showHeader: true, dialogTitle: 'Editor',
  dialogLabel: undefined as string | undefined, customHeader: false,
  label: "Order quantity", hint: "Quantity hint", error: "", required: true,
  inputId: undefined as string | undefined, ariaLabel: undefined as string | undefined,
  data: rows, controlled: false, sort: null as null | { key: string; order: "asc" | "desc" },
  sortMode: "client", sortable: true, rowAction: true,
  searchable: false, show: true, controlledExpansion: false, expanded: [] as (string | number)[], expandSingle: false,
  responsive: "card", maxHeight: undefined as number | undefined,
};
export function ContractCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(initial);
  const [events, setEvents] = useState<unknown[]>([]);
  const [selected, setSelected] = useState<object[]>([]);
  const update = (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next }));
  const emit = (name: string, value?: unknown) => setEvents(old => [...old, [name, value]]);
  Object.assign(window, { configureReview: update, resetReviewEvents: () => setEvents([]) });
  const button = (label: string, click: () => void) => <K.DsButton {...(native ? { onPress: click } : { onClick: click })}>{label}</K.DsButton>;
  const text = (value: string, id?: string) => native ? <Text testID={id}>{value}</Text> : <span data-testid={id}>{value}</span>;
  const table = location.search.includes("table");
  const Layer = config.layerKind === 'drawer' ? K.DsDrawer : K.DsModal;
  return <>
    {table ? config.show && <K.DsTable data={config.data} columns={[
      { key: "name", label: "Name", render: (_: unknown, row: typeof rows[number]) => text(row.name, "row-" + row.id) },
      { key: "amount", label: "Amount", sortable: true },
      { key: "actions", label: "Actions", render: () => button("Action", () => emit("action")) },
    ]} responsive={config.responsive} searchable={config.searchable} onSearch={(q: string) => emit("search", q)} maxHeight={config.maxHeight}
      expandedRows={config.controlledExpansion ? config.expanded : undefined} expandSingle={config.expandSingle}
      onExpandedRowsChange={(keys: (string | number)[]) => { emit("expanded", keys); if (config.accept) update({ expanded: keys }); }}
      selectable selected={selected} onSelectionChange={setSelected} expandable renderExpand={(row: typeof rows[number]) => text("Detail " + row.id)}
      sort={config.controlled ? config.sort : undefined} sortMode={config.sortMode} sortable={config.sortable}
      onSortChange={(sort: NonNullable<typeof config.sort>) => { emit("sort", sort); if (config.accept) update({ sort }); }}
      onRowClick={config.rowAction ? (row: typeof rows[number], index: number) => emit("row", [row.id, index]) : undefined}
    /> : <>
      {button("Open", () => update({ open: true }))}
      <Layer open={config.open} onOpenChange={(open: boolean) => update({ open })} title={config.dialogTitle}
        closeOnEsc={config.closeOnEsc} showHeader={config.showHeader} ariaLabel={config.dialogLabel}
        header={config.customHeader ? text('Custom heading') : undefined}>
        <K.DsFormGroup id="quantity-field" label={config.label} hint={config.hint} error={config.error} required={config.required}>
          <K.DsQuantityStepper value={config.value} disabled={config.disabled} id={config.inputId} ariaLabel={config.ariaLabel}
            onValueChange={(value: number) => { emit("value", value); if (config.accept) update({ value }); }}
            onChangeCommit={(value: number) => emit("commit", value)} onInvalidInput={(draft: string) => emit("invalid", draft)} />
        </K.DsFormGroup>
        {button("Other field", () => {})}
      </Layer>
    </>}
    <output data-testid="selected">{JSON.stringify(selected)}</output>
    <output data-testid="model">{JSON.stringify(config)}</output>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
