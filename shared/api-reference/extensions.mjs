import { readFileSync } from "node:fs";
import { detail, event, slot, fields } from "./helpers.mjs";
const bindings = JSON.parse(readFileSync(new URL("./extensions.json", import.meta.url), "utf8"));
const guides = JSON.parse(readFileSync(new URL("../component-guides.json", import.meta.url), "utf8"));
const summaries = {
  block: "부모의 전체 너비를 채우고 중앙 숫자 입력을 확장합니다. 기본값 false는 80px 입력과 정사각형 증감 버튼으로 구성합니다.",
  title: "영역이나 행의 제목입니다. 긴 문구는 줄바꿈합니다.", description: "제목 또는 행동을 보충하는 설명입니다.",
  href: "웹에서 이동할 실제 링크 주소입니다. 앱 라우터는 이동 이벤트의 기본 동작을 취소할 수 있습니다.",
  disabled: "이 컴포넌트의 사용자 입력 또는 주 행동을 막습니다. 별도 자식 컨트롤의 비활성은 직접 연결합니다.",
  ariaLabel: "시각적 라벨이 부족한 경우 사용할 접근성 이름입니다.",
  safeAreaTop: "앱이 전달하는 상단 안전 영역 여백입니다. 자체 감지나 고정 배치는 하지 않습니다.",
  safeAreaBottom: "앱이 전달하는 하단 안전 영역 여백입니다. 현재 표시되는 최하단 영역에만 적용하세요.",
  keyboardVisible: "앱이 전달하는 키보드 표시 여부입니다. 실제 키보드 감지·창 크기 조절은 앱의 책임입니다.",
  hideOnKeyboard: "keyboardVisible=true일 때 이 영역을 숨길지 결정합니다.",
  src: "로드할 이미지 URL 또는 data URL입니다. 변경하면 새 요청으로 처리합니다.",
  source: "Native 이미지 리소스입니다. 제공하면 src보다 우선하며 require로 가져온 로컬 리소스도 받습니다.",
  alt: "이미지의 내용을 설명하는 전체 대체 텍스트입니다.",
  decorative: "장식용 이미지의 접근성 이름을 숨깁니다. 인접 텍스트로 같은 정보를 이미 제공할 때 사용합니다.",
  aspectRatio: "이미지 컨테이너의 가로/세로 비율입니다. 양수가 아니면 1로 표시합니다.",
  fit: "cover는 영역을 채우며 일부를 자르고 contain은 전체 이미지를 유지합니다.",
  lazy: "웹 이미지의 브라우저 지연 로딩을 사용합니다. Native에는 이 prop이 없습니다.",
  name: "프로필의 전체 이름입니다. 이미지 실패 시 첫 글자를 표시하되 접근성 이름은 전체를 유지합니다.",
  size: "공개된 크기 중 하나를 선택합니다. Native 상호작용 영역은 최소 터치 크기를 확보합니다.",
  shape: "프로필을 원형 또는 모서리가 둥근 사각형으로 표시합니다.",
  icon: "라벨 앞에 배치할 KJUN 아이콘 이름입니다.",
  removable: "라벨 옆의 삭제 요청 버튼을 표시합니다. 항목을 자동 제거하지 않습니다.",
  removeLabel: "삭제 버튼의 접근성 이름입니다. 생략하면 라벨 뒤에 ‘삭제’를 붙입니다.",
  label: "표시하거나 조절하는 값의 목적을 설명하는 라벨입니다.",
  error: "입력 영역을 오류로 표현합니다. 검증과 오류 설명은 소비자가 제공합니다.",
  clearable: "값이 있을 때 선택한 시각을 null로 바꾸는 지우기 버튼을 표시합니다.",
  minuteStep: "분 선택지의 간격입니다. 1~59의 정수이며 0분부터 시작합니다.",
  secondStep: "초 선택지의 간격입니다. 1~59의 정수이며 0초부터 시작합니다.",
  id: "실제 숫자 입력의 ID입니다. 외부 라벨과 명시적으로 연결할 때 사용합니다.",
};
const childProps = {
  leading: slot("주 콘텐츠 앞쪽에 배치할 아이콘·이미지입니다.", "ReactNode", "ListRow의 앞 영역에는 별도의 상호작용을 넣지 말고 actions에 배치하세요."),
  trailing: slot("행 뒤쪽의 보조 정보입니다.", "ReactNode", "수치·배지 등 표시용 콘텐츠만 넣으세요. 버튼은 actions로 분리합니다."),
  actions: slot("주 콘텐츠와 분리된 보조 행동입니다.", "ReactNode", "버튼·Switch·Checkbox 등의 값과 콜백을 소비자가 연결합니다."),
  children: slot("영역 안에 배치할 소비자 콘텐츠입니다.", "ReactNode", "ListSection에는 ListRow를, BottomActionBar에는 Button·FormActions를 배치합니다."),
  fallback: slot("이미지가 없거나 실패했을 때 표시할 콘텐츠입니다.", "ReactNode", "실패해도 이미지 컨테이너의 비율과 대체 텍스트를 유지합니다."),
};
const topNavigationSlots = {
  leading: slot("뒤로 가기 등 앞쪽 탐색 행동입니다.", "ReactNode", "가용 폭의 최대 40%를 사용합니다. 내부 Button의 긴 라벨은 한 줄 말줄임하며, ariaLabel로 전체 목적을 제공하세요."),
  actions: slot("화면의 보조 행동 묶음입니다.", "ReactNode", "제목의 120px 기준 폭을 확보하기 어려우면 묶음 전체를 다음 줄로 배치합니다. 긴 Button 문구는 영역 안에서 줄바꿈합니다. Button·MenuButton·RefreshButton·IconToggle의 아이콘은 24px이며 최소 44px 컨트롤 영역을 사용합니다."),
};
const valueDescription = {
  DsBottomNavigation: "현재 목적지의 key입니다. 실제 라우팅 결과에 따라 앱이 갱신합니다.",
  DsSlider: "현재 숫자 값입니다. min~max 범위의 유한한 값을 전달합니다.",
  DsRangeSlider: "순서가 있는 [시작 값, 끝 값] 숫자 쌍입니다. 시작 값은 끝 값보다 클 수 없습니다.",
  DsTimePicker: "분 단위는 HH:mm, 초 단위는 HH:mm:ss이며 비어 있으면 null입니다. 날짜·시간대는 포함하지 않습니다.",
  DsQuantityStepper: "확정된 숫자 값입니다. 편집 중 문자열과 구분하며 지정한 precision과 범위를 만족해야 합니다.",
};
const callback = (name, key, platform) => {
  const changeWhen = name.includes("Slider") ? "드래그·트랙 선택·키보드·접근성 증감으로 실제 값이 바뀔 때" : name === "DsTimePicker" ? "시·분·초 선택 또는 지우기로 완전한 시각이 바뀔 때" : "Enter·blur 확정 또는 증감 버튼으로 숫자가 바뀔 때";
  const arg = name === "DsRangeSlider" ? "[시작 숫자, 끝 숫자]" : name === "DsTimePicker" ? "HH:mm 또는 HH:mm:ss 문자열 / null" : "새 숫자";
  if (key === "onValueChange") return event("값 변경을 소비자에게 요청합니다.", changeWhen, arg, "반환값을 사용하지 않습니다.", "소비자가 value를 갱신합니다. 패키지가 업무 상태를 소유하지 않습니다.");
  if (key === "onChangeCommit") return event("변경 조작이 완료됐음을 알립니다.", name.includes("Slider") ? "포인터 조작 종료 또는 키보드 조작 완료 시, 값이 실제로 변경된 경우" : changeWhen + ", 값 변경 콜백 다음", arg, "반환값을 사용하지 않습니다.", "저장·조회 등의 후속 요청을 연결합니다. 값 변경 콜백과 같은 요청을 중복 실행하지 마세요.");
  if (key === "onInvalidInput") return event("숫자로 확정할 수 없는 입력을 알립니다.", "Enter·blur 시 공백·잘못된 문자열·안전한 숫자 범위 초과를 발견했을 때", "입력했던 원본 문자열", "반환값을 사용하지 않습니다.", "초안은 마지막 확정값으로 복원합니다. 오류 메시지는 소비자가 표시합니다.");
  if (key === "onNavigate") return event("목적지 이동을 요청합니다.", "비활성 목적지를 제외한 링크·탐색 항목을 실행할 때", "(key, event): 목적지 key와 " + (platform === "native" ? "GestureResponderEvent" : "MouseEvent<HTMLAnchorElement>"), "웹 라우터는 event.preventDefault()로 링크의 기본 이동을 취소할 수 있습니다.", "앱이 이동과 value 갱신을 담당합니다. 수정키·가운데 클릭은 일반 링크 동작을 유지하도록 앱에서 구분하세요.");
  if (key === "onRemove") return event("라벨 삭제를 요청합니다.", "활성 삭제 버튼을 실행할 때", "없음", "반환값을 사용하지 않습니다.", "소비자가 항목을 제거합니다. 제거 후 다음 항목이나 입력으로 초점을 옮기세요.");
  if (key === "onLoad" || key === "onError") return event(key === "onLoad" ? "현재 이미지의 로드 완료를 알립니다." : "현재 이미지의 로드 실패를 알립니다.", "현재 요청 이미지에서 " + (key === "onLoad" ? "load" : "error") + "가 발생했을 때. 이전 주소·이전 요청의 응답은 무시합니다.", "없음", "반환값을 사용하지 않습니다.", "실패 대체 표현은 내부에서 표시합니다. 다른 주소로 재시도하려면 src/source를 갱신하세요.");
  if (key === "onClick" || key === "onPress") return event("목록 행의 주 행동을 실행합니다.", "비활성 행을 제외한 주 행동 영역을 실행할 때. actions의 버튼 실행과 독립적입니다.", platform === "native" ? "GestureResponderEvent" : "MouseEvent<HTMLElement>", "웹 링크의 기본 이동을 취소하려면 event.preventDefault()를 호출합니다.", "소비자가 이동·선택·실행을 처리합니다.");
  throw Error("Missing extension callback: " + name + "." + key);
};
export const extensionContracts = Object.fromEntries(Object.entries(bindings).map(([name, platforms]) => [name, Object.fromEntries(Object.entries(platforms).map(([platform, keys]) => {
  const props = Object.fromEntries(keys.map(key => {
    let entry;
    if (key.startsWith("on")) entry = callback(name, key, platform);
    else if (name === "DsTopNavigation" && topNavigationSlots[key]) entry = topNavigationSlots[key];
    else if (childProps[key]) entry = childProps[key];
    else if (key === "value") entry = detail(valueDescription[name], { "상태 책임": guides[name].interaction });
    else if (key === "items") entry = detail("안정적인 key와 이름을 가진 목적지 목록입니다.", { "항목 필드": "key: 고유 문자열, label: 전체 이름, href: 웹 링크 주소, icon?: 아이콘 이름, badge?: 문자열·숫자, disabled?: 이동 비활성. 웹에서는 href를 제공하세요.", "권장 사용": "2~5개의 주요 목적지를 권장합니다. 항목 순서와 현재 key는 앱에서 관리합니다." });
    else if (key === "thumbLabels") entry = { default: '["최솟값", "최댓값"]', ...detail("시작·끝 손잡이의 접근성 이름 쌍입니다.", { "키보드": "Tab 순서는 시작→끝으로 고정됩니다. 손잡이는 서로 넘지 않으며 Home/End도 다른 손잡이 값으로 제한됩니다." }) };
    else if (key === "precision") entry = name === "DsTimePicker" ? detail("minute는 시·분, second는 시·분·초를 제공합니다.", { "값 형태": "정밀도를 바꿀 때 소비자가 value 형식도 함께 바꾸거나 null로 초기화하세요." }) : detail("수량의 소수 자릿수입니다. 0~6의 정수를 받습니다.", { "반올림": "Enter·blur 시 지정 자리로 반올림합니다. 정확히 절반이면 절댓값이 커지는 방향이며 이후 min/max로 제한합니다.", "설정 제약": "value·min·max·step은 precision으로 표현 가능해야 하며 정수 스케일 값은 Number.MAX_SAFE_INTEGER 범위여야 합니다." });
    else if (["min", "max", "step"].includes(key)) entry = detail(name === "DsTimePicker" ? (key === "min" ? "선택할 수 있는 가장 이른 시각입니다." : "선택할 수 있는 가장 늦은 시각입니다.") : key === "step" ? (name === "DsQuantityStepper" ? "버튼과 방향키의 증감 단위입니다. 직접 입력은 배수로 강제하지 않습니다." : "최솟값부터 시작하는 선택 간격입니다. 소수 여섯 자리까지 지원합니다.") : key === "min" ? "허용하는 최솟값입니다." : "허용하는 최댓값입니다.", { "범위": name === "DsTimePicker" ? "precision과 같은 형식으로 전달하고 min ≤ max여야 합니다. 자정을 넘는 범위는 지원하지 않습니다." : name === "DsQuantityStepper" ? "min ≤ max이고 step > 0이어야 합니다. 범위를 벗어난 직접 입력은 확정할 때 제한합니다." : "min < max, step > 0이어야 합니다. max가 step에 맞지 않으면 max 이하의 마지막 단계를 사용합니다." });
    else if (summaries[key]) entry = { summary: summaries[key] };
    else if (key === "formatters") entry = { summary: "Vue의 기존 공통 formatter 주입입니다. 이 신규 컴포넌트에서는 사용하지 않습니다." };
    else throw Error("Missing extension prop description: " + name + "." + key);
    if (name === "DsQuantityStepper" && key === "block") entry.default = "false";
    if (name === "DsQuantityStepper" && key === "value") entry = detail(valueDescription[name], {
      "상태 책임": guides[name].interaction,
      "키보드": "Enter·blur는 변경값을 확정합니다. 편집 중 첫 Escape는 초안을 되돌리고 상위 창에 전달하지 않습니다. 편집이 끝난 뒤 Escape는 상위 창이 처리합니다. IME 조합 중 키와 조합 확정 keyCode=229는 수량을 확정하거나 증감하지 않습니다.",
      "폼 연결": "FormGroup의 라벨·ID·도움말·오류·필수 정보를 상속합니다. 명시한 ariaLabel·id는 입력의 이름·ID를 우선 지정하며, 오류 설명 연결은 유지합니다.",
    });
    if (name.includes("Slider") && ["min", "max", "step", "disabled"].includes(key)) entry.default = { min: "0", max: "100", step: "1", disabled: "false" }[key];
    return [key, entry];
  }));
  if (name === "DsRangeSlider" && platform === "vue2") props.value.type = "[number, number]";
  const events = {}, slots = {};
  if (platform === "vue2") {
    const eventKeys = name.includes("Slider") || ["DsTimePicker", "DsQuantityStepper"].includes(name) ? { input: "onValueChange", change: "onChangeCommit", ...(name === "DsQuantityStepper" ? { "invalid-input": "onInvalidInput" } : {}) } : name === "DsListRow" ? { click: "onClick" } : name === "DsBottomNavigation" ? { navigate: "onNavigate" } : name === "DsChip" ? { remove: "onRemove" } : ["DsImage", "DsAvatar"].includes(name) ? { load: "onLoad", error: "onError" } : {};
    for (const [eventName, key] of Object.entries(eventKeys)) events[eventName] = callback(name, key, platform);
    const slotNames = { DsListRow: ["leading", "trailing", "actions"], DsListSection: ["actions", "default"], DsTopNavigation: ["leading", "actions"], DsBottomActionBar: ["default"], DsImage: ["fallback"], DsAvatar: ["fallback"] }[name] || [];
    for (const key of slotNames) {
      const definition = name === "DsTopNavigation" ? topNavigationSlots[key] : childProps[key === "default" ? "children" : key];
      slots[key] = { ...definition, details: definition.details.map(row => row.label === "슬롯 데이터" ? { ...row, text: "제공 데이터 없음" } : row) };
    }
  }
  return [platform, { props, events, slots, ownership: [guides[name].interaction, guides[name].differences], types: name === "DsBottomNavigation" ? [fields("NavigationDestination", "목적지 목록의 항목입니다.", [["key", "string", "고유한 목적지 key"], ["label", "string", "전체 목적지 이름"], ["href", platform === "native" ? "string | undefined" : "string", "웹 이동 주소. Native에서는 앱 콜백으로 이동합니다."], ["icon", "string | undefined", "보조 아이콘"], ["badge", "string | number | undefined", "보조 수치 또는 짧은 라벨"], ["disabled", "boolean | undefined", "이 목적지 이동 비활성"]])] : [] }];
}))]));
