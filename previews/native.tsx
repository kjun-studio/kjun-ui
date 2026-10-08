import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { View, Text } from "react-native";
import { KjunProvider, DsButton, DsInput, DsModal, DsFormGroup } from "@kjun-ui/native";
import { type ButtonSize, type InputSize } from "@kjun-ui/tokens";
import { componentProps, labelFor, type DemoConfig } from "../shared/demo-config";
import { demoPalettes, demoFont } from "../shared/demo-colors";
import { connectDemo } from "./bridge";
function Demo({ config: c }: { config: DemoConfig }) {
  const [count, setCount] = useState(0),
    [value, setValue] = useState(""),
    [open, setOpen] = useState(false),
    [saved, setSaved] = useState(false);
  const props = componentProps(c);
  useEffect(() => {
    window.parent.postMessage({ type: "kjun:modal-state", open }, location.origin);
  }, [open]);
  const status = {
    color: demoPalettes[c.palette].textSecondary,
    fontFamily: demoFont,
    fontSize: 12,
    textAlign: "center" as const,
    lineHeight: 20,
  };
  return (
    <KjunProvider colors={demoPalettes[c.palette]} fontFamily={demoFont}>
      <View
        style={{
          minHeight: 260,
          padding: 28,
          justifyContent: "center",
          alignItems: "center",
          gap: 28,
          backgroundColor: demoPalettes[c.palette].surface,
        }}
      >
        {c.component === "button" ? (
          <>
            <View style={{ width: "100%", alignItems: "center" }}>
              <DsButton
                {...(props as any)}
                size={c.size as ButtonSize}
                onPress={() => setCount(count + 1)}
              >
                {labelFor(c)}
              </DsButton>
            </View>
            <Text accessibilityLiveRegion="polite" style={status}>
              {count ? count + "번 실행했습니다" : "버튼을 눌러보세요"}
            </Text>
          </>
        ) : c.component === "input" ? (
          <>
            <View style={{ width: "100%", maxWidth: 320 }}>
              <DsFormGroup label="내용" hint="입력한 값은 이 예제 안에서만 사용됩니다.">
                <DsInput
                  {...(props as any)}
                  size={c.size as InputSize}
                  value={value}
                  onChangeText={setValue}
                />
              </DsFormGroup>
            </View>
            <Text accessibilityLiveRegion="polite" style={status}>
              {value ? "입력값: " + value : "입력 대기 중"}
            </Text>
          </>
        ) : (
          <>
            <DsButton
              size="lg"
              onPress={() => {
                setSaved(false);
                setOpen(true);
              }}
            >
              모달 열기
            </DsButton>
            <Text style={status}>{saved ? "저장했습니다" : "확인·취소·닫기를 살펴보세요"}</Text>
            <DsModal
              {...(props as any)}
              open={open}
              onOpenChange={setOpen}
              onConfirm={() => {
                setSaved(true);
                setOpen(false);
              }}
            >
              <Text
                style={{
                  fontFamily: demoFont,
                  color: demoPalettes[c.palette].text,
                  fontSize: 16,
                  lineHeight: 24,
                }}
              >
                입력한 내용을 저장할까요?
              </Text>
              <Text style={{ ...status, textAlign: "left", marginTop: 12, fontSize: 14 }}>
                확인을 누르면 저장하고 모달을 닫습니다.
              </Text>
            </DsModal>
          </>
        )}
      </View>
    </KjunProvider>
  );
}
const root = createRoot(document.getElementById("root")!);
connectDemo((config) => root.render(<Demo config={config} />));
