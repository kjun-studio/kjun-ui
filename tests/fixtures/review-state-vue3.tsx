import { createApp, defineComponent, reactive, type PropType } from "vue";
import * as K from "@kjun-ui/vue3";
import { setRootValues } from "./style-values";
setRootValues();
type Option = { value: unknown; label: string; disabled?: boolean };
const options: Option[] = [
  { value: 0, label: "Number zero" }, { value: "0", label: "String zero" },
  { value: "alpha", label: "Alpha" }, { value: "beta", label: "Beta", disabled: true },
  { value: "gamma", label: "Gamma" },
];
let instance = 0;
const OptionLabel = defineComponent({
  props: { option: { type: Object as PropType<Option>, required: true } },
  setup(props) {
    const id = ++instance;
    return () => <span data-testid={props.option.label} data-instance={id}>{props.option.label}</span>;
  },
});
const s = reactive({
  controlled: false, open: false, accept: true, disabled: false, value: null as unknown,
  options, pageSize: 2, multiple: false, tabs: [] as { name: string; label: string; disabled?: boolean }[],
  tabValue: "", compound: false, accordionMultiple: true, children: ["One", "Two", "Three"], defaults: false,
  events: [] as unknown[],
});
const emit = (name: string, value?: unknown) => { s.events = [...s.events, [name, value]]; };
Object.assign(window, { configureState: (next: object) => { Object.assign(s, next); }, resetStateEvents: () => { s.events = []; } });
const kind = new URLSearchParams(location.search).get("case") || "select";
const select = () => <K.KjunSelect modelValue={s.value as any} options={s.options as any} ariaLabel="Choose" searchable
  open={s.controlled ? s.open : undefined} disabled={s.disabled} optionPageSize={s.pageSize} multiple={s.multiple}
  onUpdate:open={(open: boolean) => { emit("open", open); if (s.accept) s.open = open; }}
  onSearch={(q: string) => emit("search", q)}
  onUpdate:modelValue={(value: unknown) => { emit("value", value); if (s.accept) s.value = value; }} onChange={(value: unknown) => emit("change", value)}>
  {{ option: ({ option }: { option: Option }) => <OptionLabel option={option} /> }}
</K.KjunSelect>;
createApp(defineComponent(() => () => <K.KjunProvider>
  {kind === "select" && select()}
  {kind === "modal" && <K.KjunModal open title="Editor" onUpdate:open={() => emit("modal")}>{select()}</K.KjunModal>}
  {kind === "tabs" && <K.KjunTabs modelValue={s.tabValue} items={s.compound ? [] : s.tabs}
    onUpdate:modelValue={(value: string) => { emit("value", value); if (s.accept) s.tabValue = value; }} onChange={(value: string) => emit("change", value)}>
    {s.compound ? s.tabs.map(tab => <K.KjunTabPane key={tab.name} {...tab}>{tab.label} content</K.KjunTabPane>) : null}
  </K.KjunTabs>}
  {kind === "accordion" && <K.KjunAccordion multiple={s.accordionMultiple}>
    {s.children.map(title => <K.KjunAccordionItem key={title} title={title} defaultOpen={s.defaults}>{title} content</K.KjunAccordionItem>)}
  </K.KjunAccordion>}
  {kind === "dropdown" && <K.KjunDropdown onOpen={() => emit("open")} onClose={() => emit("close")}>
    {{ trigger: () => <K.KjunButton>Menu</K.KjunButton>, default: () => <K.KjunDropdownItem onClick={() => emit("action")}>Action</K.KjunDropdownItem> }}
  </K.KjunDropdown>}
  <button style={{ marginTop: "40px" }}>Outside</button>
  <output data-testid="events">{JSON.stringify(s.events)}</output>
</K.KjunProvider>)).mount("#root");
