import type { ExampleControl, ExamplePreset } from "./example-registry";

export const foundationNames = ["GuideScreenLayout", "GuideScrollCTA", "GuideLayerStack"];
const long: ExampleControl = { key: "long", label: "긴 콘텐츠", kind: "boolean", default: false };
const overlay: ExampleControl = { key: "overlay", label: "CTA를 본문 위에 고정", kind: "boolean", default: false };
const keyboard: ExampleControl = { key: "keyboardVisible", label: "키보드 상태 모의 적용", kind: "boolean", default: false };
const safe: ExampleControl = { key: "safeAreaBottom", label: "하단 안전 영역", kind: "number", default: 34, min: 0, max: 80 };
export const foundationControls: Record<string, ExampleControl[]> = {
  GuideScreenLayout: [long, { key: "reading", label: "읽기·입력 중심 단일 열", kind: "boolean", default: false }],
  GuideScrollCTA: [long, overlay, keyboard, safe],
  GuideLayerStack: [long, overlay, safe],
};
export const foundationPresets: Record<string, ExamplePreset[]> = {
  GuideScreenLayout: [
    { id: "reading", label: "읽기·입력", settings: { reading: true } },
    { id: "long", label: "긴 콘텐츠", settings: { long: true } },
    { id: "narrow", label: "좁은 화면", narrow: true },
  ],
  GuideScrollCTA: [
    { id: "overlay", label: "겹쳐 배치", settings: { overlay: true } },
    { id: "keyboard", label: "키보드·긴 문구", settings: { overlay: true, keyboardVisible: true, long: true } },
    { id: "narrow", label: "좁은 화면", settings: { long: true }, narrow: true },
  ],
  GuideLayerStack: [
    { id: "overlay", label: "고정 CTA와 Modal", settings: { overlay: true } },
    { id: "long", label: "긴 모달 본문", settings: { long: true } },
    { id: "narrow", label: "좁은 화면", narrow: true },
  ],
};

export const foundationPreviewCss = `.catalog-root[data-foundation-layout="true"]{padding:0}.catalog-example[data-component="GuideScreenLayout"]{max-width:none;margin-bottom:0}`;
