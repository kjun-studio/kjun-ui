import type { ExampleControl, ExamplePreset } from "./example-registry";
const bool = (key: string, label: string, value = false): ExampleControl => ({ key, label, kind: "boolean", default: value });
const choice = (key: string, label: string, options: string[], value = options[0]): ExampleControl => ({ key, label, kind: "choice", default: value, options });
const number = (key: string, label: string, value: number, min: number, max: number): ExampleControl => ({ key, label, kind: "number", default: value, min, max });
const size = choice("size", "크기", ["sm", "md", "lg"], "md"), disabled = bool("disabled", "비활성"), error = bool("error", "필드 오류"), long = bool("long", "긴 콘텐츠");
export const extensionControls: Record<string, ExampleControl[]> = {
  KjunListRow: [choice("leadingSize", "앞 영역 크기", ["자동", "xs", "sm", "md", "lg"]), bool("iconColor", "아이콘 강조색", true), bool("iconBackground", "원형 배경", true), bool("expandable", "펼침 행"), bool("current", "현재 항목"), disabled, long], KjunListSection: [choice("variant", "모양", ["default", "open", "details"]), long], KjunListGroup: [choice("variant", "모양", ["inset", "flush", "open"])], KjunListItem: [],
  KjunTopNavigation: [long, bool("showDescription", "설명 표시", true), choice("leading", "앞쪽 탐색", ["아이콘", "긴 문구", "없음"]), choice("actions", "행동 구성", ["저장", "긴 문구", "여러 행동", "아이콘 조합", "없음"]), choice("exampleWidth", "예제 너비", ["640", "390", "320", "288"], "390"), disabled, bool("loading", "행동 로딩"), number("safeAreaTop", "상단 안전 영역", 0, 0, 80)],
  KjunBottomNavigation: [choice("iconStyle", "아이콘 모양", ["auto", "filled", "outline"]), bool("showLabels", "라벨 표시", true), long, bool("keyboardVisible", "키보드 표시"), bool("hideOnKeyboard", "키보드 표시 중 숨기기", true), number("safeAreaBottom", "하단 안전 영역", 0, 0, 80)],
  KjunSideNavigation: [bool("collapsibleGroups", "묶음 접기"), bool("collapsed", "아이콘만 표시"), choice("rail", "접힌 레일", ["items", "groups"]), bool("railLabels", "레일 이름"), choice("density", "밀도", ["default", "compact"]), choice("collapsedParent", "접힌 부모", ["widen", "flyout"]), bool("groupCounts", "묶음 행 수"), bool("chrome", "머리글·바닥글"), bool("actions", "행 동작"), bool("spaces", "공간 레일과 메뉴 패널"), bool("long", "긴 이름"), bool("disabled", "비활성 목적지"), bool("neutralBadges", "회색 개수 배지"), bool("nested", "2단계 하위 항목"), bool("limit", "묶음 행 제한"), bool("empty", "빈 묶음")],
  KjunSideNavigationLayout: [bool("collapsed", "접힌 열"), choice("width", "열 폭", ["sm", "md", "lg"], "md"), bool("railLabels", "레일 이름"), bool("drawer", "좁은 화면(서랍)")],
  KjunStack: [choice("content", "내용", ["카드 내용", "설정 목록", "높이 채우기", "상품 카드"]), choice("gap", "간격", ["xs", "sm", "smMd", "md", "lg", "sectionSm"], "lg"), choice("align", "가로 정렬", ["stretch", "start", "center", "end"]), choice("justify", "세로 분배", ["start", "center", "end", "between"]), choice("divider", "구분선", ["없음", "full", "inset", "strong"]), choice("direction", "방향", ["column", "row", "좁으면 세로"]), choice("padding", "안쪽 여백", ["none", "sm", "md", "lg"]), bool("spacer", "Spacer로 나누기")],
  KjunPressable: [choice("pressEffect", "눌림 표시", ["overlay", "none"]), bool("focusRingInset", "안쪽 포커스 링"), bool("disabled", "비활성")],
  KjunFloatingNavigation: [bool("badges", "배지", true), bool("keyboardVisible", "키보드 표시"), bool("hideOnKeyboard", "키보드 표시 중 숨기기", true), number("safeAreaBottom", "하단 안전 영역", 0, 0, 80)],
  KjunBottomActionBar: [choice("variant", "모양", ["docked", "floating"]), long, bool("keyboardVisible", "키보드 표시"), bool("hideOnKeyboard", "키보드 표시 중 숨기기"), number("safeAreaBottom", "하단 안전 영역", 0, 0, 80)],
  KjunCarousel: [choice("slideSize", "슬라이드 폭", ["full", "peek", "auto"]), choice("gap", "간격", ["none", "sm", "md", "lg"], "md"), choice("indicators", "위치 표시", ["dots", "count", "none"]), choice("indicatorPlacement", "표시 위치", ["below", "overlay"]), choice("snapAlign", "정렬", ["start", "center"]), choice("bleed", "여백 밖 펼침", ["none", "sm", "md", "lg"]), bool("mouseDrag", "마우스 드래그", true), bool("controls", "이전·다음 버튼", true), bool("title", "섹션 제목"), bool("action", "전체 보기"), bool("minSlideWidth", "폭에 맞춘 장 수")],
  KjunSteps: [choice("orientation", "방향", ["horizontal", "vertical"]), choice("layout", "배치", ["auto", "full", "compact"]), choice("currentStatus", "현재 단계 상태", ["active", "error"]), number("current", "현재 단계", 2, 0, 5), choice("selectable", "고를 수 있는 단계", ["complete", "all"])],
  KjunEventCalendar: [choice("view", "보기", ["month", "week"]), bool("dimPast", "지난 날 흐리게", true), bool("markSaturday", "토요일 색", true), bool("swipeable", "스와이프로 넘기기", true), choice("weekStart", "한 주의 시작", ["일요일", "월요일"]), bool("longPress", "길게 눌러 추가")],
  KjunImage: [choice("imageState", "이미지 상태", ["정상", "로딩", "실패"]), choice("shape", "모양", ["square", "rounded", "circle"]), choice("fit", "맞춤 방식", ["cover", "contain"]), number("aspectRatio", "가로/세로 비율", 16 / 9, .25, 4), bool("autoRatio", "원본 비율(auto)"), bool("decorative", "장식 이미지")],
  KjunAvatar: [size, choice("shape", "형태", ["circle", "square"]), choice("imageState", "이미지 상태", ["이름", "사진", "실패"]), bool("decorative", "장식 이미지")],
  KjunAvatarGroup: [size, choice("shape", "형태", ["circle", "square"]), choice("people", "인원", ["3명", "5명", "128명"], "5명"), bool("pressable", "누를 수 있음"), bool("disabled", "비활성")],
  KjunChip: [size, disabled, bool("removable", "삭제 버튼", true), long],
  KjunSlider: [choice("size", "크기", ["md", "sm"]), disabled, bool("decimal", "소수 step"), choice("marks", "눈금", ["없음", "점", "라벨"]), choice("valueLabel", "손잡이 값", ["off", "drag", "always"]),
    bool("vertical", "세로"), bool("unit", "단위 표시"), bool("twoWay", "양방향 (fillOrigin)")],
  KjunRangeSlider: [choice("size", "크기", ["md", "sm"]), disabled, bool("decimal", "소수 step"), choice("marks", "눈금", ["없음", "점", "라벨"]), choice("valueLabel", "손잡이 값", ["off", "drag", "always"]),
    bool("vertical", "세로"), bool("unit", "단위 표시 (formatRange)"), number("minSteps", "최소 간격 (step 수)", 0, 0, 30)],
  KjunZoneGauge: [number("value", "값", 72, 0, 100), choice("size", "크기", ["md", "sm"]), bool("zoneLabels", "구간 이름", true), bool("missing", "데이터 없음")],
  KjunStackedBar: [choice("data", "데이터", ["기본", "작은 조각", "모두 0", "없음"]), choice("size", "크기", ["md", "sm"]), bool("legend", "범례", true)],
  KjunSplitPane: [choice("direction", "방향", ["horizontal", "vertical"]), bool("limits", "최소 크기", true), choice("unit", "크기 단위", ["ratio", "px"]), bool("collapsible", "접기 (레일)"), disabled],
  KjunColorPicker: [size, disabled, error, choice("layout", "모양", ["field", "swatch", "tool", "inline"]), bool("swatches", "견본", true), bool("custom", "자유 선택"), bool("alpha", "투명도"), bool("input", "HEX 입력"), bool("clearable", "색 없음", true), bool("recent", "최근 사용 색"), bool("eyeDropper", "스포이드")],
  KjunFileUpload: [disabled, error, bool("multiple", "여러 파일", true), choice("sample", "예시 파일", ["비어 있음", "여러 상태"])],
  KjunTimePicker: [size, disabled, error, choice("hourCycle", "시계", ["24", "12"]), choice("precision", "시간 정밀도", ["minute", "second"]), number("minuteStep", "분 간격", 1, 1, 59), { ...number("secondStep", "초 간격", 1, 1, 59), when: { precision: ["second"] } }, bool("bounded", "시각 범위 제한"), bool("clearable", "지우기", true), bool("block", "전체 너비")],
  KjunQuantityStepper: [size, disabled, error, bool("block", "전체 너비"), bool("decimal", "소수 수량"), bool("negative", "음수 허용")],
  KjunNumberInput: [size, disabled, error, choice("format", "서식", ["number", "amount", "percent"]), choice("align", "정렬", ["start", "end"]), bool("readingAid", "읽기 보조"), number("decimals", "소수 자릿수(0은 서식 기본값)", 0, 0, 6), bool("unit", "kg 단위 예제"), bool("prefix", "$ prefix 예제")],
};
const preset = (id: string, label: string, settings: Record<string, any>, values = {}): ExamplePreset => ({ id, label, settings, values });
export const extensionPresets: Record<string, ExamplePreset[]> = {
  KjunListRow: [preset("plain", "배경 없음", { leadingSize: "자동", iconBackground: false, iconColor: false }), ...["xs", "sm", "md", "lg"].map(leadingSize => preset(leadingSize, `${leadingSize} 원형 배경`, { leadingSize, iconBackground: true })), preset("long", "긴 콘텐츠", { long: true, leadingSize: "lg" })], KjunListSection: [preset("open", "열린 목록", { variant: "open" }), preset("details", "항목·값", { variant: "details" }), preset("long", "긴 콘텐츠", { long: true })], KjunListGroup: [preset("open", "열린 목록", { variant: "open" })], KjunListItem: [],
  KjunStack: [preset("settings", "설정 목록", { content: "설정 목록", gap: "sm", divider: "full" }), preset("panel", "높이 채우기", { content: "높이 채우기", spacer: true }), preset("product", "상품 카드", { content: "상품 카드", gap: "md", direction: "좁으면 세로", padding: "md" }), preset("sections", "구획 띠", { content: "설정 목록", gap: "md", divider: "strong" })],
  KjunTopNavigation: [
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
  KjunBottomNavigation: [preset("icons", "아이콘만", { showLabels: false }), preset("filled", "전부 채움", { iconStyle: "filled" }), preset("outline", "전부 선", { iconStyle: "outline" }), preset("keyboard", "키보드 표시", { keyboardVisible: true }), preset("safe-area", "안전 영역", { safeAreaBottom: 34 })],
  KjunFloatingNavigation: [preset("keyboard", "키보드 표시", { keyboardVisible: true }), preset("safe-area", "안전 영역", { safeAreaBottom: 34 })],
  KjunBottomActionBar: [preset("floating", "떠 있는 바", { variant: "floating" }), { id: "narrow", label: "좁은 화면", narrow: true }, preset("keyboard", "키보드 표시", { keyboardVisible: true }), preset("safe-area", "안전 영역", { safeAreaBottom: 34, long: true })],
  KjunCarousel: [preset("peek", "다음 카드 보이기", { slideSize: "peek", gap: "sm" }), preset("cards", "카드 줄", { slideSize: "auto", indicators: "none", title: true, action: true }), preset("perView", "폭에 맞춘 장 수", { minSlideWidth: true, title: true }), preset("count", "숫자 위치 표시", { indicators: "count" }), preset("center", "가운데 정렬", { slideSize: "peek", snapAlign: "center" }), preset("overlay", "사진 위 숫자", { indicators: "count", indicatorPlacement: "overlay" })],
  KjunSteps: [preset("error", "결제 실패", { currentStatus: "error" }), preset("compact", "축약형", { layout: "compact" }), preset("tracking", "배송 추적", { orientation: "vertical", current: 3 }), preset("complete", "모두 완료", { current: 5 })],
  KjunEventCalendar: [preset("week", "한 주 보기 카드", { view: "week", swipeable: false }), preset("long-press", "길게 눌러 추가", { longPress: true })],
  KjunImage: [preset("loading", "로컬 이미지 준비", { imageState: "로딩" }), preset("failure", "실패 대체 표현", { imageState: "실패" }), preset("contain", "원본 비율 유지", { aspectRatio: 1, fit: "contain" }), preset("rounded", "둥근 모서리", { shape: "rounded", aspectRatio: 4 / 3 }), preset("auto", "원본 비율로 높이", { autoRatio: true })],
  KjunAvatar: [preset("photo", "사진", { imageState: "사진" }), preset("failure", "사진 실패", { imageState: "실패" })],
  KjunAvatarGroup: [preset("many", "전체 128명", { people: "128명" }), preset("pressable", "목록 열기", { people: "5명", pressable: true })],
  KjunChip: [preset("long", "긴 라벨", { long: true }), preset("disabled", "삭제 비활성", { disabled: true })],
  KjunSlider: [preset("decimal", "소수 단위", { decimal: true }, { slider: .5 }), preset("marks", "눈금 라벨", { marks: "라벨" }), preset("small", "작은 크기·드래그 값", { size: "sm", valueLabel: "drag" }),
    preset("vertical", "세로", { vertical: true, marks: "점" }), preset("two-way", "양방향 보정값", { twoWay: true, unit: true }, { slider: 20 })],
  KjunRangeSlider: [preset("decimal", "소수 구간", { decimal: true }, { range: [.2, .8] }), preset("price", "가격 구간", { unit: true, minSteps: 10, marks: "라벨" }),
    preset("always", "손잡이 값 항상", { valueLabel: "always" }), preset("vertical", "세로", { vertical: true })],
  KjunZoneGauge: [preset("low", "저평가 구간", { value: 18 }), preset("missing", "데이터 없음", { missing: true })],
  KjunStackedBar: [preset("empty", "모두 0", { data: "모두 0" }), preset("missing", "데이터 없음", { data: "없음" })],
  KjunSplitPane: [preset("vertical", "상하 분할", { direction: "vertical" }), preset("free", "한계 없음", { limits: false }), preset("rail", "접히는 목록", { unit: "px", collapsible: true })],
  KjunColorPicker: [preset("all", "전체 옵션", { custom: true, alpha: true, input: true }, { color: "#3B82F6CC" }), preset("free", "자유 선택만", { swatches: false, clearable: false, custom: true, input: true }), preset("inline", "페이지에 펼친 패널", { layout: "inline", custom: true, input: true, recent: true }), preset("toolbar", "툴바 색 버튼", { layout: "tool", size: "sm" })],
  KjunFileUpload: [preset("states", "여러 상태", { sample: "여러 상태" }), preset("single", "파일 1개", { multiple: false, sample: "여러 상태" })],
  KjunTimePicker: [preset("twelve", "12시간제", { hourCycle: "12" }, { time: "13:30" }), preset("seconds", "초 단위", { precision: "second" }, { time: "09:30:15" }), preset("bounded", "시각 범위", { precision: "second", bounded: true }), preset("error", "오류", { error: true })],
  KjunQuantityStepper: [preset("block", "전체 너비", { block:true }), preset("decimal", "소수 수량", { decimal: true }, { quantity: 1.25 }), preset("negative", "음수와 반올림", { decimal: true, negative: true }, { quantity: -1.25 }), preset("error", "오류", { error: true })],
  KjunNumberInput: [preset("amount", "금액·읽기 보조", { format: "amount", readingAid: true }, { amount: "1250000" }), preset("percent", "퍼센트", { format: "percent" }, { amount: "12.5" }), preset("unit", "단위 suffix", { unit: true, decimals: 1 }, { amount: "62.5" }), preset("prefix", "$ prefix", { prefix: true }, { amount: "1234.50" }), preset("end", "끝 정렬", { format: "amount", align: "end" }, { amount: "1250000" }), preset("error", "오류", { error: true })],
};
export const recipeNames = ["GuideGenericLists", "GuideAppScreen", "GuideInputSettings", "GuideBottomSheet", "GuideThumbnail", "GuideSegmentedSelection", "GuideTransferForm"];
for (const name of recipeNames) {
  extensionControls[name] = [choice("content", "콘텐츠", ["기본", "긴 콘텐츠"])];
  extensionPresets[name] = [preset("long", "긴 콘텐츠", { content: "긴 콘텐츠" }), { id: "narrow", label: "좁은 화면", narrow: true }];
}
extensionControls.GuideAppScreen.push(bool("keyboardVisible", "키보드 표시"), number("safeAreaTop", "상단 안전 영역", 24, 0, 80), number("safeAreaBottom", "하단 안전 영역", 34, 0, 80));
