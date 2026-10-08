import { useState } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, KjunFeedbackProvider, useKjunFeedback, DsButton, DsCombobox, DsFormGroup, DsInput, DsSelect, DsTimePicker } from "@kjun-ui/react";
import { setRootValues } from "./style-values";
import { ComboboxCase } from "./review-combobox";
setRootValues();
const scenario = new URLSearchParams(location.search).get("scenario");
function InputCase() {
  const [value, setValue] = useState("");
  const [prevent, setPrevent] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const log = (event: string) => setEvents(old => [...old, event]);
  Object.assign(window, { configureReview: (next: { prevent: boolean }) => setPrevent(next.prevent) });
  return <><DsInput value={value} onValueChange={setValue} ariaLabel="한글 입력" data-prevent-enter={prevent}
    onKeyDown={event => { if (prevent) event.preventDefault(); }}
    onCompositionStart={() => log("start")} onCompositionEnd={() => log("end")} onEnter={() => log("enter")} />
    <output data-testid="events">{JSON.stringify(events)}</output></>;
}
function TimeCase() {
  const [value, setValue] = useState<string | null>("10:30:15");
  const [error, setError] = useState("");
  Object.assign(window, { configureReview: (next: { error: string }) => setError(next.error) });
  return <><DsFormGroup id="review-time" label="예약 시간" hint="영업시간 안에서 선택하세요" error={error}>
    <DsTimePicker value={value} precision="second" onValueChange={setValue} />
  </DsFormGroup><output data-testid="time">{value ?? "none"}</output>
    <DsFormGroup label="종료 시간"><DsTimePicker value="11:45" /></DsFormGroup></>;
}
function SelectCase() {
  const [value, setValue] = useState<string | number | (string | number)[] | null>(null);
  return <DsFormGroup label="담당자" id="review-select" hint="담당자를 검색하세요">
    <DsSelect value={value} searchable options={[{ value: "a", label: "Alpha" }]} onValueChange={setValue} />
  </DsFormGroup>;
}
function PromptCase() {
  const feedback = useKjunFeedback(), [value, setValue] = useState<string | null>("pending");
  return <><DsButton onClick={() => { void feedback.prompt({ title: "이름 입력" }).then(setValue); }}>입력 열기</DsButton>
    <output data-testid="prompt">{value}</output></>;
}
createRoot(document.getElementById("root")!).render(<KjunProvider><KjunFeedbackProvider>
  {scenario === "input" ? <InputCase /> : scenario === "time" ? <TimeCase /> : scenario === "select" ? <SelectCase /> : scenario === "prompt" ? <PromptCase /> : <ComboboxCase Control={DsCombobox} />}
</KjunFeedbackProvider></KjunProvider>);
