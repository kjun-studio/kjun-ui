import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunCombobox, KjunFormGroup, KjunTimePicker } from "@kjun-ui/native";
import { scopedColors } from "./style-values";
import { ComboboxCase } from "./review-combobox";
function TimeCase() {
  const [value, setValue] = useState<string | null>("10:30:15");
  const [error, setError] = useState("");
  Object.assign(window, { configureReview: (next: { error: string }) => setError(next.error) });
  return <><KjunFormGroup id="review-time" label="예약 시간" hint="영업시간 안에서 선택하세요" error={error}>
    <KjunTimePicker value={value} precision="second" onValueChange={setValue} />
  </KjunFormGroup><output data-testid="time">{value ?? "none"}</output>
    <KjunFormGroup label="종료 시간"><KjunTimePicker value="11:45" /></KjunFormGroup></>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider colors={scopedColors(false)}>
  {location.search.includes("time") ? <TimeCase /> : <ComboboxCase Control={KjunCombobox} />}
</KjunProvider>);
