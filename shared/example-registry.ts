import { iconControls, iconExampleNames, iconSizeValues } from './icon-examples.ts';
import { accessibilityExampleNames } from "./accessibility-examples.ts";
import { interactionExampleNames } from "./interaction-examples.ts";
import { cardControls, cardDesignPresets } from "./card-examples.ts";
import { motionExampleNames } from "./motion-examples.ts";
import { foundationControls, foundationPresets, foundationNames } from "./foundation-examples.ts";
import { tableControls, tableDesignPresets } from "./table-examples.ts";
import { extensionControls, extensionPresets, recipeNames } from "./extension-examples.ts";
import catalog from "./component-catalog.json" with { type: "json" };
import type { PlatformName } from "./demo-config";

export type Setting = string | number | boolean;
export type Settings = Record<string, Setting>;
export type Values = Record<string, any>;
export interface ExampleControl {
  key: string;
  label: string;
  kind: "boolean" | "choice" | "text" | "number";
  default: Setting;
  options?: string[];
  min?: number;
  max?: number;
  when?: Record<string, Setting[]>;
}
export interface ExamplePreset {
  id: string;
  label: string;
  settings?: Settings;
  values?: Values;
  narrow?: boolean;
}
const toggle = (key: string, label: string, value = false): ExampleControl => ({ key, label, kind: "boolean", default: value });
const choice = (key: string, label: string, options: string[], value = options[0]): ExampleControl => ({ key, label, kind: "choice", options, default: value });
const field = (key: string, label: string, value: string): ExampleControl => ({ key, label, kind: "text", default: value });
const number = (key: string, label: string, value: number, max = 5000): ExampleControl => ({ key, label, kind: "number", default: value, min: 0, max });
const disabled = toggle("disabled", "비활성"), loading = toggle("loading", "로딩"), error = toggle("error", "오류");
const size = choice("size", "크기", ["sm", "md", "lg"], "md");
const controls: Record<string, ExampleControl[]> = {};
const assign = (names: string, list: ExampleControl[]) => names.split(" ").forEach(name => { controls["Ds" + name] = [...list]; });
assign("Checkbox Switch Radio RadioGroup Combobox ButtonGroup FilterGroup CopyButton RefreshButton", [disabled]);
assign("IconToggle MenuButton RefreshButton", [disabled, loading]);
assign("IconToggle", [choice("usage", "사용 예제", ["기본", "즐겨찾기", "관심"]), choice("size", "크기", ["xs", "sm", "md", "lg", "xl"], "md"), disabled, loading]);
assign("RefreshButton", [choice("mode", "표현", ["icon", "text"], "icon"), choice("size", "크기", ["xs", "sm", "md", "lg", "xl"], "sm"), disabled, loading]);
assign("Textarea DatePicker Combobox", [size, disabled, error]);
assign("Dropdown", [disabled]);
assign("DropdownItem", [toggle("itemDisabled", "첫 항목 비활성")]);
assign("Accordion AccordionItem", [choice("tone", "배경", ["card", "muted"]), toggle("multiple", "복수 펼침"), toggle("itemDisabled", "첫 항목 비활성")]);
assign("FormActions", [choice("comparison", "비교", ["기본", "크기", "변형", "표시"]), choice("size", "크기", ["sm", "md", "lg"], "lg"), choice("variant", "확인 표현", ["primary", "danger", "success"]), choice("cancelVariant", "취소 표현", ["ghost", "secondary"]), field("confirmText", "확인 문구", "저장"), field("cancelText", "취소 문구", "취소"), toggle("showConfirm", "확인 표시", true), toggle("showCancel", "취소 표시", true), choice("exampleWidth", "예제 폭", ["360", "288", "200"]), toggle("cancelDisabled", "취소 비활성"), toggle("disabled", "확인 비활성"), toggle("loading", "확인 로딩")]);
assign("Modal", [choice("size", "크기", ["sm", "md", "lg", "xl", "full"], "md"), toggle("disabled", "확인 비활성"), toggle("loading", "확인 로딩")]);
assign("Button", [choice("comparison", "비교", ["기본", "크기", "변형", "라벨·아이콘", "상태"]), choice("size", "크기", ["xs", "sm", "md", "lg", "xl"], "md"), choice("variant", "변형", ["primary", "secondary", "ghost", "danger", "danger-ghost", "success", "warning"]), disabled, loading, toggle("iconOnly", "아이콘 전용"), toggle("block", "전체 너비")]);
assign("Tabs TabPane", [choice("variant", "표현", ["underline", "pills"]), choice("density", "밀도", ["comfortable", "compact"])]);
assign("ButtonGroup", [choice("size", "크기", ["xs", "sm", "md", "lg", "xl"], "md"), disabled, toggle("fullWidth", "전체 너비")]);
assign("MenuButton", [choice("size", "크기", ["xs", "sm", "md", "lg", "xl"], "md"), choice("variant", "변형", ["secondary", "ghost", "primary", "danger", "danger-ghost", "success", "warning"], "secondary"), toggle("compact", "아이콘 전용"), disabled, loading]);
assign("Input", [choice("comparison", "비교", ["기본", "크기", "상태", "아이콘·단위"]), size, disabled, toggle("readOnly", "읽기 전용"), error]);
controls.DsCard = cardControls;
assign("Popover", [toggle("noPadding", "기본 여백 제거")]);
assign("ChartSkeleton", [choice("kind", "차트 종류", ["line", "grid", "bar", "donut", "candle", "matrix"]), field("loadingText", "로딩 문구", "차트를 불러오는 중")]);
// Alert renders two sizes; "lg" stays accepted for compatibility but draws md, so the example offers sm and md.
assign("Alert", [choice("tone", "종류", ["info", "success", "warning", "danger", "primary"]), choice("size", "크기", ["sm", "md"], "md"), field("title", "제목", "안내"), field("body", "본문", "작업 상태를 설명하는 문장입니다."), toggle("closable", "닫기 표시", true), toggle("action", "재시도 버튼")]);
assign("Icon", [toggle("spin", "회전")]);
assign("Skeleton", [toggle("animated", "애니메이션")]);
assign("FormSkeleton", [size, toggle("multiline", "여러 줄 입력")]);
assign("KpiHero KpiRow SignedValue", [loading]);
controls.DsKpiRow.push(toggle("mobileSummary", "모바일 요약", true));
controls.DsSignedValue.push(toggle("stale", "오래된 값"));
assign("PriceCell", [toggle("stale", "오래된 값")]);
assign("MarketSimpleList MarketTable MarketCards MarketListPanel", [loading, error]);
assign("Select", [size, toggle("multiple", "복수 선택"), toggle("searchable", "검색", true), toggle("clearable", "지우기", true), disabled, loading, error]);
assign("SearchInput", [size, number("minChars", "최소 글자 수", 1, 10), number("debounce", "검색 대기 시간(ms)", 0, 2000), toggle("clearable", "지우기", true), disabled, toggle("error", "필드 오류"), choice("response", "검색 응답", ["정상", "빈 결과", "느린 응답", "요청 실패", "긴 결과"])]);
assign("FormGroup", [field("label", "라벨", "내용"), field("hint", "도움말", "도움말을 입력에 연결합니다."), toggle("required", "필수 입력", true), field("errorMessage", "오류 메시지", ""), toggle("childDisabled", "입력 필드 비활성")]);
assign("Table", [toggle("sortable", "정렬 허용", true), toggle("selectable", "행 선택", true), toggle("expandable", "행 확장", true), toggle("searchable", "검색", true), choice("responsive", "모바일 표현", ["card", "compact", "none"]), loading, error]);
controls.DsTable.unshift(...tableControls);
assign("DataState", [size, toggle("preserveContent", "이전 콘텐츠 유지", true), toggle("skeleton", "스켈레톤", true), toggle("empty", "빈 상태"), choice("queryState", "조회 상태", ["정상", "최초 로딩", "최초 실패", "조건 변경", "동일 조건 갱신", "갱신 실패"]), field("loadingText", "로딩 문구", "로딩 중..."), field("refreshingText", "갱신 문구", "갱신 중..."), field("emptyText", "빈 상태 문구", "데이터가 없습니다"), field("emptyIcon", "빈 상태 아이콘", ""), field("emptyActionText", "빈 상태 행동", ""), field("retryText", "재시도 문구", "다시 시도")]);
controls.KjunFeedbackProvider = [
  choice("service", "서비스", ["전체", "Toast", "Confirm", "Prompt"]),
  { ...field("title", "Toast 제목", "저장 완료"), when: { service: ["전체", "Toast"] } },
  { ...field("message", "Toast 메시지", "저장했습니다"), when: { service: ["전체", "Toast"] } },
  { ...field("confirmTitle", "Confirm 제목", "변경을 저장할까요?"), when: { service: ["전체", "Confirm"] } },
  { ...field("confirmMessage", "Confirm 메시지", "확인하면 변경 사항을 저장합니다."), when: { service: ["전체", "Confirm"] } },
  { ...field("promptTitle", "Prompt 제목", "목록 이름 입력"), when: { service: ["전체", "Prompt"] } },
  { ...field("promptMessage", "Prompt 메시지", "두 글자 이상의 이름을 입력하세요."), when: { service: ["전체", "Prompt"] } },
  choice("tone", "종류", ["success", "info", "warning", "danger"]),
  { ...number("duration", "알림 유지 시간(ms)", 0, 10000), when: { service: ["전체", "Toast"] } },
  { ...toggle("closable", "알림 닫기", true), when: { service: ["전체", "Toast"] } },
  { ...field("confirmText", "확인 문구", "확인"), when: { service: ["전체", "Confirm", "Prompt"] } },
  { ...field("cancelText", "취소 문구", "취소"), when: { service: ["전체", "Confirm", "Prompt"] } },
  { ...choice("confirmAction", "확인 처리", ["즉시 완료", "비동기 완료", "비동기 실패"]), when: { service: ["전체", "Confirm"] } },
  { ...field("initialValue", "입력 시작값", ""), when: { service: ["전체", "Prompt"] } },
  { ...toggle("validate", "두 글자 이상 검증", true), when: { service: ["전체", "Prompt"] } },
];
for (const name of ["GuideSettingsForm", "GuideSearchToolbar", "GuideAssetList"]) {
  controls[name] = [choice("content", "콘텐츠", ["기본", "긴 콘텐츠"]), ...(name === "GuideSettingsForm" ? [toggle("validation", "검증 오류")] : name === "GuideAssetList" ? [choice("status", "조회 상태", ["정상", "최초 로딩", "빈 결과", "실패"])] : [])];
}
controls.DsModal.push(field("title", "제목", "작업 확인"), field("confirmText", "확인 문구", "확인"));
const preset = (id: string, label: string, settings: Settings = {}, values: Values = {}): ExamplePreset => ({ id, label, settings, values });
const long = "긴 한국어 이름과 안내 문장이 여러 줄에 걸쳐 표시되는 예제입니다";
const extras: Record<string, ExamplePreset[]> = {
  DsAlert: [preset("primary", "브랜드 안내", { tone: "primary" }), preset("body", "본문만", { title: "" }), preset("title", "제목만", { body: "" }), preset("compact", "작은 알림", { size: "sm" }), preset("retry", "실패·재시도", { tone: "danger", title: "목록을 불러오지 못했습니다", body: "네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요.", action: true }), { ...preset("long", "긴 문구", { tone: "danger", title: "프로젝트 변경 사항을 저장하지 못했습니다", body: "네트워크 연결 상태를 확인한 뒤 다시 시도해 주세요. 입력한 내용은 그대로 유지됩니다." }), narrow: true }],
  DsFormActions: [
    preset("sizes", "크기 비교", { comparison: "크기" }),
    preset("variants", "변형 비교", { comparison: "변형" }),
    preset("visibility", "버튼 표시 비교", { comparison: "표시" }),
    preset("single", "확인 버튼만", { showCancel: false }),
    { ...preset("narrow", "좁은 폭 · 200px", { exampleWidth: "200", confirmText: "변경 사항 저장" }), narrow: true },
    { ...preset("long", "긴 문구 · 288px", { exampleWidth: "288", cancelText: "Cancel", confirmText: "Save changes and continue to next step" }), narrow: true },
  ],
  DsIconToggle: [preset("favorite", "즐겨찾기", { usage: "즐겨찾기" }), preset("interest", "관심", { usage: "관심" })],
  DsMenuButton: [preset("compact", "아이콘 전용", { compact: true }), preset("loading", "로딩", { loading: true }), preset("ghost", "낮은 강조", { variant: "ghost" })],
  DsRefreshButton: [preset("text", "아이콘과 라벨", { mode: "text" }), preset("text-loading", "라벨을 유지하는 로딩", { mode: "text", loading: true }), preset("toolbar", "일반 버튼과 함께 · md", { mode: "text", size: "md" })],
  DsButton: [
    preset("sizes", "크기 비교", { comparison: "크기" }),
    preset("variants", "변형 비교", { comparison: "변형" }),
    preset("labels", "라벨·아이콘 비교", { comparison: "라벨·아이콘" }),
    preset("states", "상태 비교", { comparison: "상태" }),
    { ...preset("narrow", "전체 너비 · 375px", { block: true, size: "lg" }), narrow: true },
  ],
  DsCard: [...cardDesignPresets, preset("dividers", "구분선", { dividers:true })],
  DsPopover: [preset("no-padding", "여백 직접 구성", { noPadding:true })],
  DsKpiRow: [preset("equal", "세 지표 동등 표시", { mobileSummary:false }), { ...preset("summary", "모바일 요약", { mobileSummary:true }), narrow:true }],
  DsInput: [preset("sizes", "크기 비교", { comparison: "크기" }), preset("states", "상태 비교", { comparison: "상태" }), preset("affixes", "아이콘·단위 비교", { comparison: "아이콘·단위" }), { ...preset("narrow", "좁은 화면 · 375px"), narrow: true }],
  DsSelect: [preset("multiple", "복수 선택", { multiple: true }, { select: ["a", "c"] }), preset("long", "긴 옵션", { data: "long" }), preset("empty", "빈 옵션", { data: "empty" }), preset("error", "오류", { error: true })],
  DsSearchInput: [preset("empty", "빈 결과", { response: "빈 결과" }), preset("slow", "느린 응답", { response: "느린 응답" }), preset("failure", "요청 실패", { response: "요청 실패" }), preset("long", "긴 결과", { response: "긴 결과" })],
  DsFormGroup: [preset("required", "필수 입력", { required: true }), preset("long", "긴 라벨·도움말", { label: long, hint: long }), preset("error", "검증 오류", { errorMessage: "내용을 입력해 주세요." })],
  DsTable: [...tableDesignPresets, preset("selection", "선택·확장", {}, { selected: [], expanded: ["a"] }), preset("long", "긴 셀", { data: "long" }), preset("empty", "빈 데이터", { data: "empty" }), preset("error", "오류", { error: true }), { ...preset("narrow", "좁은 화면"), narrow: true }],
  DsDataState: [preset("initial", "최초 로딩", { queryState: "최초 로딩" }), preset("spinner", "스피너 로딩", { queryState: "최초 로딩", skeleton: false }), preset("empty", "빈 결과", { empty: true }), preset("empty-action", "빈 결과·행동", { empty: true, emptyIcon: "search", emptyActionText: "조건 초기화" }), preset("changed", "조건 변경", { queryState: "조건 변경" }), preset("refresh", "동일 조건 갱신", { queryState: "동일 조건 갱신" }), preset("failure", "갱신 실패·재시도", { queryState: "갱신 실패" }), { ...preset("long-retry", "긴 재시도·좁은 화면", { queryState: "최초 실패", retryText: "네트워크 연결을 확인한 후 다시 시도하기" }), narrow: true }, { ...preset("long-refresh", "긴 갱신·좁은 화면", { queryState: "동일 조건 갱신", refreshingText: "최신 문서와 세부 정보를 업데이트하고 있습니다" }), narrow: true }],
  KjunFeedbackProvider: [preset("success", "성공 알림", { service: "Toast", duration: 3000 }), preset("persistent", "직접 닫는 알림", { service: "Toast", duration: 0 }), preset("confirm", "확인·취소", { service: "Confirm" }), preset("async", "비동기 확인", { service: "Confirm", confirmAction: "비동기 완료" }), preset("failure", "비동기 실패", { service: "Confirm", confirmAction: "비동기 실패" }), preset("validation", "입력 검증", { service: "Prompt" })],
};
for (const name of ["GuideSettingsForm", "GuideSearchToolbar", "GuideAssetList"]) extras[name] = [preset("long", "긴 콘텐츠", { content: "긴 콘텐츠" }), { ...preset("narrow", "좁은 화면"), narrow: true }];
Object.assign(controls, extensionControls, foundationControls, iconControls);
Object.assign(extras, extensionPresets, foundationPresets);
export const designExampleNames = ["GuideActionPlacement", "GuideLongFields", "GuideLongButton", "GuideRowActions", "GuideFieldErrors", "GuideDeleteConfirmation", "GuideRefreshContext", "GuideEmptyVsError", "GuideBottomCtaLayout", "GuideKeyboardLayout"];
for (const name of designExampleNames) {
  controls[name] = [choice("arrangement", "구성", ["after", "before"])];
  extras[name] = [preset("before", "전 · 피해야 할 구성", { arrangement: "before" })];
}
const layers = new Set("Select Combobox SearchInput DatePicker TimePicker Dropdown DropdownItem DropdownDivider MenuButton Tooltip Popover Modal Drawer".split(" ").map(n => "Ds" + n));
export const exampleNames = [...catalog.filter(x => x.kind !== "internal").map(x => x.name), "KjunProvider", "KjunFeedbackProvider", "GuideSettingsForm", "GuideSearchToolbar", "GuideAssetList", ...recipeNames, ...designExampleNames, ...foundationNames, ...motionExampleNames, ...accessibilityExampleNames, ...interactionExampleNames, ...iconExampleNames];
export function exampleDefinition(name: string) {
  if (!exampleNames.includes(name)) throw Error("존재하지 않는 예제: " + name);
  const list = controls[name] || [];
  const presets: ExamplePreset[] = [preset("default", "기본"), ...(extras[name] || [])];
  if (!extras[name] && list.some(c => c.key === "error")) presets.push(preset("error", "오류", { error: true }));
  const defaults = Object.fromEntries(list.map(c => [c.key, c.default])) as Settings;
  if (name === "DsFormGroup") defaults.required = false;
  return { name, controls: list, presets, defaults, platforms: ["vue2", "react", "native"] as PlatformName[],
    minHeight: name === "GuideLayerStack" || name === "GuideScrollCTA" || name === "GuideBottomSheet" || name === "KjunFeedbackProvider" || ["DsModal", "DsDrawer"].includes(name) ? 600 : name === "DsPopover" ? 240 : layers.has(name) ? 400 : 160,
    limitation: foundationNames.includes(name) ? "가용 폭과 CTA 높이는 실행 환경에서 다시 측정합니다. 키보드 상태·안전 영역은 모의 입력이며 기기 검증을 대신하지 않습니다. 스크롤 위치·포커스·표시 중인 Toast는 복원하지 않습니다." : name === "DsQuantityStepper" ? "확정된 숫자를 복사합니다. 편집 중인 미확정 문자열은 Enter 또는 초점 이동으로 확정한 뒤 복사하세요." : name === "DsTable" ? "선택·확장 행은 복원합니다. 내부 정렬 방향 표시와 검색창의 검색어는 기본 상태로 시작합니다." : name === "KjunFeedbackProvider" ? "서비스 옵션을 복사합니다. 진행 중인 요청, Prompt에서 입력 중인 값, 알림의 남은 시간은 복원하지 않습니다." : layers.has(name) ? "공개 API로 제어되는 값과 열림 상태를 복원합니다. hover·focus와 내부 검색·팝업 상태는 기본 상태로 시작할 수 있습니다." : "공개 API로 설정할 수 있는 현재 값을 코드의 시작값으로 복사합니다. 내부 상태와 hover·focus는 복원하지 않습니다.",
  };
}
export function presetConfig(name: string, id = "default") {
  const definition = exampleDefinition(name);
  const preset = definition.presets.find(p => p.id === id);
  if (!preset) throw Error("존재하지 않는 프리셋");
  return { settings: { ...definition.defaults, ...preset.settings }, values: { ...preset.values }, narrow: !!preset.narrow };
}
export function visibleControls(name: string, settings: Settings, platform: PlatformName = "vue2") {
  const fixed = new Set<string>();
  if (settings.comparison && settings.comparison !== '기본') {
    if (name === 'DsButton') {
      ['iconOnly', 'block'].forEach(key => fixed.add(key));
      if (settings.comparison === '변형') fixed.add('variant');
      if (settings.comparison === '상태') ['disabled', 'loading'].forEach(key => fixed.add(key));
    }
    if (name === 'DsInput') ['disabled', 'readOnly', 'error'].forEach(key => fixed.add(key));
    if (name === 'DsFormActions') {
      if (settings.comparison === '변형') ['variant', 'cancelVariant', 'confirmText'].forEach(key => fixed.add(key));
      if (settings.comparison === '표시') ['showCancel', 'showConfirm'].forEach(key => fixed.add(key));
    }
    if (settings.comparison === '크기') fixed.add('size');
  }
  return exampleDefinition(name).controls.filter(c => !fixed.has(c.key) && !(name === "DsRadioGroup" && c.key === "disabled" && platform !== "vue2") && (!c.when || Object.entries(c.when).every(([key, values]) => values.includes(settings[key]))));
}
export function validateSettings(name: string, settings: unknown): Settings {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw Error("설정은 객체여야 합니다.");
  const definition = exampleDefinition(name), output = { ...definition.defaults };
  for (const [key, value] of Object.entries(settings)) {
    if (key === "visual" && typeof value === "string") {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || value.length > 12000) throw Error("잘못된 시각 예제 설정");
      output[key] = value; continue;
    }
    if (key === "data" && ["long", "empty"].includes(value)) { output[key] = value; continue; }
    const control = definition.controls.find(c => c.key === key);
    if (!control || typeof value !== typeof control.default) throw Error("지원하지 않는 설정: " + key);
    if (control.options && !control.options.includes(value)) throw Error("지원하지 않는 값: " + key);
    if (control.kind === "number" && (!Number.isFinite(value) || value < control.min! || value > control.max!)) throw Error("범위를 벗어난 값: " + key);
    if (typeof value === "string" && value.length > 2000) throw Error("입력 길이 초과");
    if (name === "GuideIconSelection" && key === "name" && (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 100)) throw Error("잘못된 아이콘 이름");
    if (name === "GuideIconSelection" && key === "size" && !iconSizeValues.includes(value as number)) throw Error("지원하지 않는 아이콘 크기");
    output[key] = value;
  }
  return output;
}
