import { useState } from "react";
import { Text } from "react-native";

export const options = [
  { value: 0, label: "Number zero" }, { value: "0", label: "String zero" },
  { value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta", disabled: true },
  { value: "gamma", label: "Gamma" },
];
export const initial = {
  controlled: false, open: false, accept: true, disabled: false, value: null as unknown,
  options, pageSize: 2, multiple: false, tabs: [] as { name: string; label: string; disabled?: boolean }[],
  tabValue: "", compound: false, accordionMultiple: true, children: ["One", "Two", "Three"], defaults: false,
};
let instance = 0;
function Option({ option, native }: { option: typeof options[number]; native: boolean }) {
  const [id] = useState(() => ++instance);
  return native ? <Text testID={option.label} dataSet={{ instance: id }}>{option.label}</Text>
    : <span data-testid={option.label} data-instance={id}>{option.label}</span>;
}
export function StateCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(initial), [events, setEvents] = useState<unknown[]>([]);
  const update = (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next }));
  const emit = (name: string, value?: unknown) => setEvents(old => [...old, [name, value]]);
  Object.assign(window, { configureState: update, resetStateEvents: () => setEvents([]) });
  const kind = new URLSearchParams(location.search).get("case") || "select";
  const button = (label: string) => <K.DsButton>{label}</K.DsButton>;
  const select = <K.DsSelect value={config.value} options={config.options} ariaLabel="Choose" searchable
    open={config.controlled ? config.open : undefined} disabled={config.disabled} optionPageSize={config.pageSize} multiple={config.multiple}
    onOpenChange={(open: boolean) => { emit("open", open); if (config.accept) update({ open }); }}
    onSearch={(q: string) => emit("search", q)} renderOption={(option: typeof options[number]) => <Option option={option} native={native} />}
    onValueChange={(value: unknown) => { emit("value", value); if (config.accept) update({ value }); }} onChange={(value: unknown) => emit("change", value)} />;
  return <>
    {kind === "select" && select}
    {kind === "modal" && <K.DsModal open title="Editor" onOpenChange={() => emit("modal")}>{select}</K.DsModal>}
    {kind === "tabs" && <K.DsTabs value={config.tabValue} items={config.compound ? undefined : config.tabs}
      onValueChange={(value: string) => { emit("value", value); if (config.accept) update({ tabValue: value }); }} onChange={(value: string) => emit("change", value)}>
      {config.compound && config.tabs.map(tab => <K.DsTabPane key={tab.name} {...tab}>{tab.label} content</K.DsTabPane>)}
    </K.DsTabs>}
    {kind === "accordion" && <K.DsAccordion multiple={config.accordionMultiple}>
      {config.children.map(title => <K.DsAccordionItem key={title} title={title} defaultOpen={config.defaults}>{title} content</K.DsAccordionItem>)}
    </K.DsAccordion>}
    {kind === "dropdown" && <K.DsDropdown trigger={button("Menu")} onOpen={() => emit("open")} onClose={() => emit("close")}>
      <K.DsDropdownItem onClick={() => emit("action")}>Action</K.DsDropdownItem>
    </K.DsDropdown>}
    <button style={{ marginTop: 40 }} onClick={() => {}}>Outside</button>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
