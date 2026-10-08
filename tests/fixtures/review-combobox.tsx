import { useState } from "react";
import type { DsCombobox } from "@kjun/react";

export function ComboboxCase({ Control }: { Control: typeof DsCombobox }) {
  const dynamic = location.search.includes("dynamic");
  const [config, setConfig] = useState({ value: dynamic ? null as string | null : "a", label: "Alpha", blocked: false, removed: false });
  const [query, setQuery] = useState("");
  Object.assign(window, { configureReview: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <>
    <Control ariaLabel="목록 검색" value={config.value}
      options={config.removed ? [] : [{ value: "a", label: config.label, disabled: config.blocked }, { value: "b", label: "Beta" }]}
      onSearch={setQuery}
      onValueChange={value => { setConfig(old => ({ ...old, value: value as string | null })); }} />
    <output data-testid="query">{query}</output>
    <output data-testid="selected">{config.value ?? "none"}</output>
  </>;
}
