import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup } from "@kjun/react";
import { type ButtonSize, type InputSize } from "@kjun/tokens";
import { componentProps, labelFor, type DemoConfig } from "../shared/demo-config";
import { connectDemo } from "./bridge";
function Demo({ config: c }: { config: DemoConfig }) {
  const [count, setCount] = useState(0),
    [value, setValue] = useState(""),
    [open, setOpen] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    window.parent.postMessage({ type: "kjun:modal-state", open }, location.origin);
  }, [open]);
  const props = componentProps(c);
  return (
    <KjunProvider>
      <div className="demo-stage" data-component={c.component}>
        {c.component === "button" ? (
          <>
            <div className="demo-control">
              <DsButton
                {...(props as any)}
                size={c.size as ButtonSize}
                onClick={() => setCount(count + 1)}
              >
                {labelFor(c)}
              </DsButton>
            </div>
            <output aria-live="polite">
              {count ? count + "번 실행했습니다" : "버튼을 눌러보세요"}
            </output>
          </>
        ) : c.component === "input" ? (
          <>
            <div className="demo-field">
              <DsFormGroup label="내용" hint="입력한 값은 이 예제 안에서만 사용됩니다.">
                <DsInput
                  {...(props as any)}
                  size={c.size as InputSize}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </DsFormGroup>
            </div>
            <output aria-live="polite">{value ? "입력값: " + value : "입력 대기 중"}</output>
          </>
        ) : (
          <>
            <DsButton
              size="lg"
              onClick={() => {
                setSaved(false);
                setOpen(true);
              }}
            >
              모달 열기
            </DsButton>
            <output aria-live="polite">
              {saved ? "저장했습니다" : "확인·취소·닫기를 살펴보세요"}
            </output>
            <DsModal
              {...(props as any)}
              open={open}
              onOpenChange={setOpen}
              onConfirm={() => {
                setSaved(true);
                setOpen(false);
              }}
            >
              <p style={{ margin: 0 }}>입력한 내용을 저장할까요?</p>
              <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--kjun-text-secondary)" }}>
                확인을 누르면 저장하고 모달을 닫습니다.
              </p>
            </DsModal>
          </>
        )}
      </div>
    </KjunProvider>
  );
}
const root = createRoot(document.getElementById("root")!);
connectDemo((config) => root.render(<Demo config={config} />));
