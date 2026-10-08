import { useState, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  KjunProvider,
  KjunFeedbackProvider,
  useKjunFeedback,
  DsButton,
  DsSelect,
  DsSearchInput,
  DsCheckbox,
  DsRadioGroup,
  DsSwitch,
  DsTabs,
  DsTabPane,
  DsDropdown,
  DsDropdownItem,
  DsAccordion,
  DsAccordionItem,
  DsCard,
  DsBadge,
  DsProgress,
  DsSkeleton,
  DsTooltip,
} from "@kjun-ui/native";
import {
  cssValues,
  scopedColors,
  scopedFont,
  setRootValues,
} from "./style-values";
setRootValues();
const loadOptions = (query: string, { signal }: { signal: AbortSignal }) =>
  new Promise<{ id: string; name: string }[]>((resolve) => {
    signal.addEventListener("abort", () => {
      (window as any).aborts = ((window as any).aborts || 0) + 1;
    });
    setTimeout(
      () => resolve([{ id: query, name: query + " result" }]),
      query === "slow" ? 650 : 50
    );
  });
function Content() {
  const feedback = useKjunFeedback(),
    [checked, setChecked] = useState(false),
    [toggle, setToggle] = useState(false),
    [radio, setRadio] = useState<any>("a"),
    [selected, setSelected] = useState<any>(null),
    [query, setQuery] = useState(""),
    [tab, setTab] = useState("one"),
    [message, setMessage] = useState("");
  return (
    <div style={{ padding: 24, display: "grid", gap: 16, maxWidth: 520 }}>
      <DsCard title="상태">
        <DsBadge>배지</DsBadge>
        <DsProgress value={42} showLabel />
        <DsSkeleton rows={1} />
      </DsCard>
      <DsCheckbox
        value={checked}
        label="체크"
        onValueChange={(v) => setChecked(!!v)}
      />
      <DsSwitch value={toggle} label="스위치" onValueChange={setToggle} />
      <DsRadioGroup
        value={radio}
        ariaLabel="라디오"
        options={[
          { value: "a", label: "A" },
          { value: "b", label: "B", disabled: true },
          { value: "c", label: "C" },
        ]}
        onValueChange={setRadio}
      />
      <DsSelect
        value={selected}
        options={[
          { value: "a", label: "사과" },
          { value: "b", label: "배", disabled: true },
          { value: "c", label: "체리" },
        ]}
        ariaLabel="과일"
        clearable
        onValueChange={setSelected}
      />
      <output data-testid="selected">{selected}</output>
      <DsSearchInput
        value={query}
        ariaLabel="원격 검색"
        loadOptions={loadOptions}
        onValueChange={setQuery}
        onSelect={(o) => setMessage(o.name)}
      />
      <DsTabs value={tab} onValueChange={setTab}>
        <DsTabPane name="one" label="첫 탭">
          첫 내용
        </DsTabPane>
        <DsTabPane name="two" label="둘째 탭">
          둘째 내용
        </DsTabPane>
      </DsTabs>
      <DsDropdown trigger={<DsButton>메뉴 열기</DsButton>}>
        <DsDropdownItem onPress={() => setMessage("chosen")}>
          메뉴 항목
        </DsDropdownItem>
      </DsDropdown>
      <DsTooltip content="도움말">
        <DsButton>도움</DsButton>
      </DsTooltip>
      <DsAccordion>
        <DsAccordionItem title="열기 하나">내용 하나</DsAccordionItem>
        <DsAccordionItem title="열기 둘">내용 둘</DsAccordionItem>
      </DsAccordion>
      <DsButton
        onPress={async () => {
          const a = feedback.confirm({ title: "첫 확인" }),
            b = feedback.prompt({
              title: "다음 입력",
              validator: (v) => v.length > 1 || "두 글자 이상",
            });
          setMessage(JSON.stringify([await a, await b]));
        }}
      >
        대기열 시작
      </DsButton>
      <DsButton
        onPress={() => feedback.toast.success("영역 알림", { duration: 0 })}
      >
        알림 표시
      </DsButton>
      <output role="status">{message}</output>
    </div>
  );
}
function App() {
  const [changed, setChanged] = useState(false);
  return (
    <KjunProvider
      colors={scopedColors(changed)}
      fontFamily={scopedFont(changed)}
    >
      <DsButton onPress={() => setChanged((v) => !v)}>영역 색상 변경</DsButton>
      <KjunFeedbackProvider>
        <Content />
      </KjunFeedbackProvider>
    </KjunProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
