import { useState } from "react";
import type { KjunCombobox } from "@kjun-ui/react";

export function ComboboxCase({ Control }: { Control: typeof KjunCombobox }) {
  const dynamic = location.search.includes("dynamic");
  const [config, setConfig] = useState({ value: dynamic ? null as string | null : "a", label: "Alpha", blocked: false, removed: false, loading: false });
  const [query, setQuery] = useState("");
  Object.assign(window, { configureReview: (next: Partial<typeof config>) => setConfig(old => ({ ...old, ...next })) });
  return <>
    <Control ariaLabel="목록 검색" value={config.value} searchKeys={["code"]} loading={config.loading}
      options={config.removed ? [] : [{ value: "a", label: config.label, code: "SUB", disabled: config.blocked }, { value: "b", label: "Beta", code: "BTA" }]}
      onSearch={setQuery}
      onValueChange={value => { setConfig(old => ({ ...old, value: value as string | null })); }} />
    <output data-testid="query">{query}</output>
    <output data-testid="selected">{config.value ?? "none"}</output>
  </>;
}
