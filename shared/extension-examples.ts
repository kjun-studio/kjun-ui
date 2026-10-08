import type { ExampleControl, ExamplePreset } from "./example-registry";
const bool = (key: string, label: string, value = false): ExampleControl => ({ key, label, kind: "boolean", default: value });
const choice = (key: string, label: string, options: string[], value = options[0]): ExampleControl => ({ key, label, kind: "choice", default: value, options });
const number = (key: string, label: string, value: number, min: number, max: number): ExampleControl => ({ key, label, kind: "number", default: value, min, max });
const size = choice("size", "크기", ["sm", "md", "lg"], "md"), disabled = bool("disabled", "비활성"), error = bool("error", "필드 오류"), long = bool("long", "긴 콘텐츠");
export const extensionControls: Record<string, ExampleControl[]> = {
  DsListRow: [disabled, long], DsListSection: [long],
  DsTopNavigation: [long, bool("showDescription", "설명 표시", true), choice("leading", "앞쪽 탐색", ["아이콘", "긴 문구", "없음"]), choice("actions", "행동 구성", ["저장", "긴 문구", "여러 행동", "아이콘 조합", "없음"]), choice("exampleWidth", "예제 너비", ["640", "390", "320", "288"], "390"), disabled, bool("loading", "행동 로딩"), number("safeAreaTop", "상단 안전 영역", 0, 0, 80)],
  DsBottomNavigation: [long, bool("keyboardVisible", "키보드 표시"), bool("hideOnKeyboard", "키보드 표시 중 숨기기", true), number("safeAreaBottom", "하단 안전 영역", 0, 0, 80)],
  DsBottomActionBar: [long, bool("keyboardVisible", "키보드 표시"), bool("hideOnKeyboard", "키보드 표시 중 숨기기"), number("safeAreaBottom", "하단 안전 영역", 0, 0, 80)],
  DsImage: [choice("imageState", "이미지 상태", ["정상", "로딩", "실패"]), choice("fit", "맞춤 방식", ["cover", "contain"]), number("aspectRatio", "가로/세로 비율", 16 / 9, .25, 4), bool("decorative", "장식 이미지")],
  DsAvatar: [size, choice("shape", "형태", ["circle", "square"]), choice("imageState", "이미지 상태", ["이름", "사진", "실패"]), bool("decorative", "장식 이미지")],
  DsChip: [size, disabled, bool("removable", "삭제 버튼", true), long],
  DsSlider: [disabled, bool("decimal", "소수 step")], DsRangeSlider: [disabled, bool("decimal", "소수 step")],
  DsTimePicker: [size, disabled, error, choice("precision", "시간 정밀도", ["minute", "second"]), number("minuteStep", "분 간격", 1, 1, 59), { ...number("secondStep", "초 간격", 1, 1, 59), when: { precision: ["second"] } }, bool("bounded", "시각 범위 제한"), bool("clearable", "지우기", true)],
  DsQuantityStepper: [size, disabled, error, bool("block", "전체 너비"), bool("decimal", "소수 수량"), bool("negative", "음수 허용")],
};
const preset = (id: string, label: string, settings: Record<string, any>, values = {}): ExamplePreset => ({ id, label, settings, values });
export const extensionPresets: Record<string, ExamplePreset[]> = {
  DsListRow: [preset("long", "긴 콘텐츠", { long: true })], DsListSection: [preset("long", "긴 콘텐츠", { long: true })],
  DsTopNavigation: [
    preset("safe-area", "안전 영역·긴 제목", { safeAreaTop: 24, long: true }),
    preset("title-only", "제목만", { leading: "없음", actions: "없음", showDescription: false }),
    preset("no-description", "설명 없음", { showDescription: false }),
    preset("no-leading", "앞쪽 탐색 없음", { leading: "없음" }),
    preset("long-action", "긴 행동 · 320px", { actions: "긴 문구", exampleWidth: "320" }),
    preset("long-leading", "긴 앞쪽 문구 · 320px", { leading: "긴 문구", exampleWidth: "320" }),
    preset("multiple", "여러 행동 · 288px", { actions: "여러 행동", exampleWidth: "288" }),
    preset("mixed", "아이콘 조합 · 390px", { actions: "아이콘 조합" }),
    preset("narrow", "긴 제목 · 320px", { long: true, exampleWidth: "320" }),
  ],
  DsBottomNavigation: [preset("keyboard", "키보드 표시", { keyboardVisible: true }), preset("safe-area", "안전 영역", { safeAreaBottom: 34 })],
  DsBottomActionBar: [{ id: "narrow", label: "좁은 화면", narrow: true }, preset("keyboard", "키보드 표시", { keyboardVisible: true }), preset("safe-area", "안전 영역", { safeAreaBottom: 34, long: true })],
  DsImage: [preset("loading", "로컬 이미지 준비", { imageState: "로딩" }), preset("failure", "실패 대체 표현", { imageState: "실패" }), preset("contain", "원본 비율 유지", { aspectRatio: 1, fit: "contain" })],
  DsAvatar: [preset("photo", "사진", { imageState: "사진" }), preset("failure", "사진 실패", { imageState: "실패" })],
  DsChip: [preset("long", "긴 라벨", { long: true }), preset("disabled", "삭제 비활성", { disabled: true })],
  DsSlider: [preset("decimal", "소수 단위", { decimal: true }, { slider: .5 })], DsRangeSlider: [preset("decimal", "소수 구간", { decimal: true }, { range: [.2, .8] })],
  DsTimePicker: [preset("seconds", "초 단위", { precision: "second" }, { time: "09:30:15" }), preset("bounded", "시각 범위", { precision: "second", bounded: true }), preset("error", "오류", { error: true })],
  DsQuantityStepper: [preset("block", "전체 너비", { block:true }), preset("decimal", "소수 수량", { decimal: true }, { quantity: 1.25 }), preset("negative", "음수와 반올림", { decimal: true, negative: true }, { quantity: -1.25 }), preset("error", "오류", { error: true })],
};
export const recipeNames = ["GuideGenericLists", "GuideAppScreen", "GuideInputSettings", "GuideBottomSheet", "GuideThumbnail", "GuideSegmentedSelection"];
for (const name of recipeNames) {
  extensionControls[name] = [choice("content", "콘텐츠", ["기본", "긴 콘텐츠"])];
  extensionPresets[name] = [preset("long", "긴 콘텐츠", { content: "긴 콘텐츠" }), { id: "narrow", label: "좁은 화면", narrow: true }];
}
extensionControls.GuideAppScreen.push(bool("keyboardVisible", "키보드 표시"), number("safeAreaTop", "상단 안전 영역", 24, 0, 80), number("safeAreaBottom", "하단 안전 영역", 34, 0, 80));
