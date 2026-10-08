import { createRoot } from "react-dom/client";
import { useState } from "react";
import { KjunProvider, DsSearchInput, DsSelect, DsDatePicker, DsFormGroup, DsPagination } from "@kjun-ui/native";
import { scopedColors } from "./style-values";
import { SearchCase, PaginationCase } from "./review-followup-cases";
function FieldsCase() {
  const [value, setValue] = useState<string | number | (string | number)[] | null>(null);
  const [date, setDate] = useState("2026-09-14"), [error, setError] = useState("");
  Object.assign(window, { configureFollowup: (next: { error: string }) => setError(next.error) });
  return <>
    <DsFormGroup id="followup-select" label="담당자" hint="담당자를 선택하세요" error={error}>
      <DsSelect value={value} options={[{ value: "a", label: "Alpha" }]} searchable onValueChange={setValue} />
    </DsFormGroup>
    <DsFormGroup id="followup-date" label="출발 날짜" hint="출발일을 선택하세요" error={error} required>
      <DsDatePicker value={date} onValueChange={setDate} />
    </DsFormGroup>
    <output data-testid="date">{date}</output>
  </>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}>
  {location.search.includes("fields") ? <FieldsCase /> : location.search.includes("pagination") ? <PaginationCase Control={DsPagination} /> : <SearchCase Control={DsSearchInput} />}
</KjunProvider>);
