import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunFeedbackProvider, useKjunFeedback, DsFormGroup, DsCombobox, DsSearchInput, DsModal, DsButton } from "@kjun/native";
import { scopedColors } from "./style-values";

const options = [{ value: "a", label: "Alpha", name: "Alpha" }];
const loadOptions = async () => options;
function FieldCase({ id }: { id: string }) {
  const [value, setValue] = useState<string | number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  Object.assign(window, { ["setError_" + id]: setError });
  return <DsFormGroup id={id} label={id} hint="Field hint" error={error} required>
    {location.search.includes("remote")
      ? <DsSearchInput ariaLabel="Search" value={query} onValueChange={setQuery} loadOptions={loadOptions} />
      : <DsCombobox ariaLabel="Search" value={value} onValueChange={setValue} options={options} />}
  </DsFormGroup>;
}
function ToastCase() {
  const feedback = useKjunFeedback();
  const [open, setOpen] = useState(false);
  Object.assign(window, {
    showToast: () => feedback.toast.info("Timed message", { duration: 1000, action: { label: "Action", onClick() {} } }),
    openModal: () => setOpen(true),
  });
  return <><button data-testid="outside">Outside</button>
    <DsModal open={open} onOpenChange={setOpen} title="Modal"><DsButton>Modal target</DsButton></DsModal></>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}><KjunFeedbackProvider>
  {location.search.includes("toast") ? <ToastCase /> : <><FieldCase id="first" /><FieldCase id="second" /></>}
</KjunFeedbackProvider></KjunProvider>);
