import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunFeedbackProvider, useKjunFeedback, DsCombobox, DsSearchInput, DsModal } from "@kjun/react";
import { setRootValues } from "./style-values";

setRootValues();
const options = [{ value: "a", label: "Alpha", name: "Alpha" }, { value: "b", label: "Beta", name: "Beta" }];
const loadOptions = async () => options;
function AutocompleteCase() {
  const [value, setValue] = useState<string | number | null>(null);
  const [query, setQuery] = useState("");
  const [enters, setEnters] = useState(0);
  return <>
    {location.search.includes("remote")
      ? <DsSearchInput ariaLabel="Search" value={query} onValueChange={setQuery} loadOptions={loadOptions}
          onSelect={option => setValue(option.value)} onEnter={() => setEnters(n => n + 1)} />
      : <DsCombobox ariaLabel="Search" value={value} options={options} onValueChange={setValue} />}
    <output data-testid="selected">{value ?? "none"}</output>
    <output data-testid="enters">{enters}</output>
  </>;
}
function ToastCase() {
  const feedback = useKjunFeedback();
  const [open, setOpen] = useState(false);
  Object.assign(window, {
    showToast: () => feedback.toast.info("Timed message", { duration: 1000, action: { label: "Action", onClick() {} } }),
    openModal: () => setOpen(true),
  });
  return <><button data-testid="outside">Outside</button>
    <DsModal open={open} onOpenChange={setOpen} title="Modal"><button>Modal target</button></DsModal></>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider><KjunFeedbackProvider>
  {location.search.includes("toast") ? <ToastCase /> : <AutocompleteCase />}
</KjunFeedbackProvider></KjunProvider>);
