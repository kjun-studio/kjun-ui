import { createApp, defineComponent, reactive } from "vue";
import { KjunProvider, KjunFeedbackProvider, useKjunFeedback, KjunCombobox, KjunSearchInput, KjunModal } from "@kjun-ui/vue3";
import { setRootValues } from "./style-values";

setRootValues();
const options = [{ value: "a", label: "Alpha", name: "Alpha" }, { value: "b", label: "Beta", name: "Beta" }];
const loadOptions = async () => options;
const AutocompleteCase = defineComponent(() => {
  const s = reactive({ value: null as string | number | null, query: "", enters: 0 });
  return () => <>
    {location.search.includes("remote")
      ? <KjunSearchInput ariaLabel="Search" modelValue={s.query} onUpdate:modelValue={(v: string) => { s.query = v; }} loadOptions={loadOptions}
          onSelect={(option: any) => { s.value = option.value; }} onEnter={() => { s.enters++; }} />
      : <KjunCombobox ariaLabel="Search" modelValue={s.value} options={options} onUpdate:modelValue={(v: any) => { s.value = v; }} />}
    <output data-testid="selected">{s.value ?? "none"}</output>
    <output data-testid="enters">{s.enters}</output>
  </>;
});
const ToastCase = defineComponent(() => {
  const feedback = useKjunFeedback();
  const s = reactive({ open: false });
  Object.assign(window, {
    showToast: () => feedback.toast.info("Timed message", { duration: 1000, action: { label: "Action", onClick() {} } }),
    openModal: () => { s.open = true; },
  });
  return () => <><button data-testid="outside">Outside</button>
    <KjunModal open={s.open} onUpdate:open={(v: boolean) => { s.open = v; }} title="Modal"><button>Modal target</button></KjunModal></>;
});
createApp(defineComponent(() => () => <KjunProvider><KjunFeedbackProvider>
  {location.search.includes("toast") ? <ToastCase /> : <AutocompleteCase />}
</KjunFeedbackProvider></KjunProvider>)).mount("#root");
