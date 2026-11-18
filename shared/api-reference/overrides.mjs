// Explicit component/prop bindings: sharing a name alone does not imply the same contract.
export const overrides = {};
const set = (names, props, platform = "common") => {
  for (const name of names.split(" ")) {
    const entry = (overrides["Kjun" + name] ||= {});
    entry[platform] = {
      ...entry[platform],
      ...Object.fromEntries(
        Object.entries(props).map(([key, value]) => [
          key,
          typeof value === "string" ? { summary: value } : value,
        ]),
      ),
    };
  }
};
set("Dropdown MenuButton", { open: "v-model:open으로 표시 상태를 제어합니다. 생략하면 내부 상태를 사용합니다. update:open은 변경 요청이며 open·close는 실제 표시 전환을 알립니다. disabled 또는 로딩 중인 트리거는 열리지 않습니다." }, "vue3");
set("Popover Tooltip", {
  panelClass: "팝업 내용에 적용할 클래스입니다. Popover는 dialog, Tooltip은 말풍선에 적용하며 트리거에는 적용하지 않습니다.",
  panelStyle: "팝업 내용의 스타일입니다. Popover는 dialog, Tooltip은 말풍선에 적용합니다. 일반 class·style은 트리거 영역에 적용합니다.",
}, "vue3");
for (const platform of ["vue3", "react"]) set("Tabs", {
  stickyHeader: "가장 가까운 스크롤 컨테이너에서 탭 헤더를 고정합니다. 패널은 기존 탭 안에 유지되어 키보드 이동·aria-controls 연결이 보존됩니다.",
  stickyOffset: "고정 헤더의 위쪽 간격입니다. 숫자는 px, 문자열은 CSS 길이이며 기본값은 0입니다. stickyHeader=true일 때 적용합니다.",
}, platform);
// Native Web sticks with position: sticky; iOS and Android have no sticky view, so the app's ScrollView owns it there.
set("Tabs", {
  stickyHeader: "Native Web에서 가장 가까운 스크롤 영역에 탭 헤더를 고정합니다. iOS·Android에는 스스로 고정되는 뷰가 없으므로 탭 막대를 부모 ScrollView의 stickyHeaderIndices에 넣으세요.",
  stickyOffset: { type: "number", summary: "Native Web 고정 헤더의 위쪽 간격(pt)입니다. 기본값은 0이며 stickyHeader=true일 때 적용합니다." },
}, "native");
set("Tabs", { lazy: "각 TabPane의 내용을 그 탭을 처음 고를 때 그립니다. 한 번 그린 패널은 다른 탭으로 가도 숨긴 채 상태를 지킵니다. 차트·표처럼 무거운 탭이 여럿일 때 첫 화면 비용을 줄입니다. 기본값 false는 모든 패널을 처음부터 그립니다." });
set("TabPane", { badge: { type: "string | number | null", summary: "null·undefined는 배지를 숨기고 숫자 0은 표시합니다." } }, "vue3");
set("KpiRow", { items: "KpiRowItem 배열입니다. value가 null·undefined 또는 유한하지 않은 숫자면 missingText(기본 —)를 표시합니다. loading 중에는 스켈레톤이 우선하며 실제 0은 숫자로 표시합니다. badge=null은 숨김이고, 배지는 라벨 바로 뒤에 놓입니다. clickable 또는 href 항목은 값 줄 끝에 chevron을 그립니다. href 항목은 실제 링크(Native는 RN Web에서만 링크, 기기에서는 버튼)로 그리고, 클릭 콜백·item-click에 세 번째 인자로 이벤트를 넘겨 라우터가 preventDefault할 수 있게 합니다. Enter는 한 번만(자동 반복 무시), Space는 키를 뗄 때 동작합니다. 숫자는 표시 자릿수로 반올림한 값으로 방향 색을 정합니다. mobileSecondary: true인 항목만 모바일 요약의 인라인 줄로 내려갑니다." });
set("Progress", {
  value: { type: "number | null", summary: "진행 값입니다. null·유한하지 않은 값·유효하지 않은 max는 데이터 없음이며 0%로 바꾸지 않습니다. 생략 또는 undefined는 기존 기본값 0을 유지합니다." },
  indeterminate: "실행 중이지만 진행률을 모를 때 사용합니다. 수치와 aria-valuenow를 생략하고 진행 중 상태를 표시합니다. 데이터 없음(null)과 구분합니다.",
});
set("Input Textarea Select Combobox DatePicker DateRangePicker SearchInput", {
  error: "필드를 오류 상태로 표시합니다. 오류 설명과 검증 결과는 소비자가 별도로 제공합니다.",
});
set("Empty", {
  headingLevel: "제목을 h2–h6로 그려 페이지 제목 구조에 넣습니다(Native는 header 역할). false(기본)는 일반 문단입니다. 페이지·패널의 유일한 내용일 때 씁니다.",
  live: "polite는 빈 상태가 나타날 때 화면 낭독기에 알립니다(role status). 검색·필터 직후 결과가 비었을 때 씁니다. 기본값 off는 알리지 않습니다.",
  size: "md는 페이지·패널용(위아래 32px, 32px 아이콘, 16px 제목), sm은 카드·목록 안용(위아래 24px, 24px 아이콘, 14px 제목)입니다. 설명은 두 크기 모두 14px/20px 본문이고, 아이콘 선은 크기와 관계없이 1.5px입니다.",
});
for (const platform of ["react", "native"]) set("Empty", {
  description: "비어 있는 이유와 다음 행동입니다. 문자열은 14px/20px 보조색 본문으로 그리고, 링크나 강조가 필요하면 노드를 넣습니다.",
  icon: "아이콘 이름이면 tertiary 색의 1.5px 선 아이콘으로 그립니다. 일러스트나 다른 크기의 아이콘은 요소를 직접 넣습니다(색·선 굵기는 넣은 요소가 정합니다).",
  children: "설명 아래 행동 영역입니다. 버튼 여러 개는 8px 간격으로 한 줄에 놓이고, 화면 너비 640px 이하에서는 넣은 순서대로 한 줄에 하나씩 최대 280px 너비로 쌓입니다.",
}, platform);
set("Alert", {
  variant: "info·success·warning·danger·primary 표현입니다. primary는 프로젝트의 brandSubtleBg·brandLight(생략 시 border)·brand 역할을 사용하며 type보다 우선합니다.",
  size: "sm은 조밀한 12px/16px 본문, md는 제목 유무와 관계없이 14px/20px 본문을 사용합니다. lg는 호환성을 위해 md와 동일합니다.",
  closable: "닫기 버튼을 표시합니다. sm은 24px, md는 28px이며 ✕가 본문 여백 끝에 맞춰집니다. 실행하면 내부 알림을 숨기고 닫힘을 한 번 통지합니다.",
  actions: "본문 아래 행동 영역입니다. size를 생략한 KjunButton은 sm 알림에서 xs, md 알림에서 sm 크기를 사용하고, secondary는 surface 배경을 사용합니다. 직접 지정한 size가 우선합니다.",
});
set("FormGroup", {
  required: "필수 표시와 자식 필드 맥락을 제공합니다. 자체 검증이나 입력값 저장은 하지 않습니다.",
  error: "오류 메시지입니다. 비어 있지 않으면 hint보다 우선 표시합니다.",
  children: "라벨과 설명을 공유할 입력 컨트롤을 배치합니다.",
});
set("Table", {
  data: "표시할 행 객체 배열입니다. 검색 결과 필터링과 서버 페이지 데이터 교체는 소비자가 합니다.",
  selected: "선택된 행 객체 배열입니다. onSelectionChange 또는 selection-change 결과를 반영하세요.",
  columns: "열 키·라벨·정렬·셀 표현을 정의합니다. row 데이터와 열 키를 연결하세요.",
  searchable: "검색 입력과 검색어 통지를 제공합니다. 데이터 배열을 직접 필터링하지 않습니다.",
});
set("DropdownItem", {
  keepOpen: { default: "false", summary: "고른 뒤에도 메뉴를 닫지 않습니다. 여러 번 켜고 끄는 checked 항목에 씁니다." },
  selected: "하나만 고르는 항목의 선택 여부입니다. 앞쪽 열에 체크를 그리고 radio 메뉴 항목으로 읽힙니다. null이면 일반 행동 항목입니다.",
  checked: "켜고 끄는 항목의 상태입니다. 앞쪽 열에 체크를 그리고 checkbox 메뉴 항목으로 읽힙니다. null이면 일반 행동 항목입니다.",
  description: "라벨 아래 둘째 줄 설명입니다. 12px 보조색으로 보입니다.",
  shortcut: "끝에 보이는 단축키 안내(예: ⌘D)입니다. 웹은 aria-keyshortcuts로도 알립니다. 실제 키 연결은 소비자가 합니다. Native는 Native Web에서만 보입니다.",
});
set("Dropdown MenuButton", { density: { default: '"comfortable"', summary: "compact는 32px 행으로 표·툴바 같은 데스크톱 화면에 씁니다. 터치 기기는 44px를 유지합니다." } });
set("DropdownSection", {
  value: "주면 value가 있는 항목을 한 묶음의 단일 선택으로 만듭니다. value가 같은 항목에 체크를 그리고 radio 메뉴 항목으로 읽힙니다. null이면 아무것도 고르지 않은 상태입니다. 하위 메뉴 안의 항목은 묶음에 들지 않습니다.",
  onValueChange: "항목을 고르면 그 항목의 value로 호출합니다. 항목의 onClick·onPress 뒤에 호출됩니다.",
}, "react");
set("DropdownSection", {
  value: "주면 value가 있는 항목을 한 묶음의 단일 선택으로 만듭니다. value가 같은 항목에 체크를 그리고 radio 메뉴 항목으로 읽힙니다. null이면 아무것도 고르지 않은 상태입니다. 하위 메뉴 안의 항목은 묶음에 들지 않습니다.",
  onValueChange: "항목을 고르면 그 항목의 value로 호출합니다. 항목의 onPress 뒤에 호출됩니다.",
}, "native");
set("DropdownSection", { modelValue: "v-model로 value가 있는 항목을 한 묶음의 단일 선택으로 만듭니다. value가 같은 항목에 체크를 그리고 radio 메뉴 항목으로 읽힙니다. null이면 아무것도 고르지 않은 상태입니다. 고르면 update:modelValue와 change가 그 항목의 value로 발생합니다. 하위 메뉴 안의 항목은 묶음에 들지 않습니다." }, "vue3");
set("DropdownItem", { value: "value가 있는 KjunDropdownSection 안에서 이 항목이 나타내는 값입니다. 묶음의 value와 같으면 선택된 항목으로 그립니다. 묶음 밖에서는 쓰지 않습니다." });
set("Dropdown MenuButton", {
  open: "표시 상태를 제어합니다. 생략하면 내부 상태를 사용합니다. 주면 onOpenChange에서 값을 바꿔야 열리고 닫힙니다. disabled 또는 로딩 중인 트리거는 열리지 않습니다.",
  onOpenChange: "열기·닫기 요청입니다. onOpen·onClose는 실제 표시 전환을 알립니다.",
}, "react");
set("Dropdown MenuButton", {
  open: "표시 상태를 제어합니다. 생략하면 내부 상태를 사용합니다. 주면 onOpenChange에서 값을 바꿔야 열리고 닫힙니다. disabled 또는 로딩 중인 트리거는 열리지 않습니다.",
  onOpenChange: "열기·닫기 요청입니다. onOpen·onClose는 실제 표시 전환을 알립니다.",
  triggerId: "트리거 버튼의 id(nativeID)입니다. Native Web은 이 id로 메뉴 이름을 연결합니다(aria-labelledby). 생략하면 트리거의 라벨을 메뉴 이름으로 씁니다.",
}, "native");
set("DropdownSection", { ariaLabel: "제목 없이 묶을 때 화면 낭독기에 알릴 묶음 이름입니다. title이 있으면 title이 이름이 됩니다.", title: "묶음 위의 작은 제목입니다. 화면 낭독기에는 묶음 이름으로 읽힙니다.", children: "묶음에 넣을 KjunDropdownItem·KjunDropdownSubmenu입니다." });
set("DropdownSubmenu", {
  id: "하위 메뉴를 구분하는 안정적인 키입니다. 생략하면 label을 씁니다. 같은 단계에 라벨이 같은 하위 메뉴가 둘 이상이면 각각 id를 주세요. 주지 않으면 둘이 함께 열립니다.",
  label: "하위 메뉴 행과 돌아가기 행의 라벨입니다.",
  icon: "하위 메뉴 행 앞쪽 열의 아이콘 이름입니다.",
  disabled: "하위 메뉴를 열 수 없게 합니다.",
  children: "하위 메뉴에서 보일 KjunDropdownItem·KjunDropdownSection입니다.",
});
set("MenuButton", {
  size: { default: "md", summary: "Button과 같은 높이·모서리·아이콘 크기를 사용합니다. 기본 md는 40px이며 좁은 도구 모음에는 sm을 명시하세요." },
  variant: { default: "secondary", summary: "세 플랫폼 모두 secondary가 기본입니다. 열린 동안 해당 변형의 active 색상 역할을 유지합니다." },
  compact: "true이면 정사각형 아이콘 버튼(기본 dots-vertical)을 표시합니다. label은 화면에서 숨기고 접근성 이름으로 유지합니다.",
  icon: "트리거 아이콘 이름입니다. label이 보이면 라벨 앞에, compact이거나 label이 없으면 dots-vertical 대신 표시합니다.",
  chevron: { default: "true", summary: "보이는 label 뒤에 열림 방향 chevron을 표시합니다. 아이콘만으로 메뉴임이 드러나는 도구 모음에서는 false로 끕니다. 열린 상태는 채움 색으로 계속 표시합니다." },
  loading: "라벨과 너비를 유지하며 아이콘 위치에 스피너를 표시합니다. 최소 400ms 동안 메뉴 열기를 막고, 열려 있던 메뉴는 닫습니다. disabled가 별도로 true인 경우에만 흐리게 표시합니다.",
});
set("Radio Checkbox", {
  val: "이 항목이 나타내는 값입니다. 현재 그룹 선택값인 value와 구분합니다.",
  value:
    "현재 선택값입니다. Checkbox는 boolean 또는 선택값 배열, Radio는 그룹의 선택값을 사용합니다.",
});
set("Radio", { value: "현재 그룹의 선택값입니다. val과 같으면 이 항목을 선택 상태로 표시합니다." });
set("Switch", { value: "현재 켜짐 여부입니다. 변경 통지 결과를 boolean 값으로 반영합니다." });
set("Checkbox", { indeterminate: { default: "false", summary: "일부 선택 상태를 빼기 표시와 실제 체크박스의 mixed 상태로 전달합니다. value(Vue v-model)와 콜백은 boolean 또는 배열을 유지합니다. 누르면 전체 선택(true)을 요청합니다. 전체 선택에서는 value=모두 선택됨, indeterminate=일부만 선택됨으로 설정하고 변경 요청을 반영할 때 함께 갱신하세요." } });
set("Tabs", { actions: "탭 헤더의 작업 영역입니다. Select·Dropdown 같은 별도 목록을 가진 컨트롤도 사용할 수 있으며 탭 선택과 독립적으로 동작합니다." }, "react");
set("Popover", { trigger: "팝오버를 여는 단일 버튼 또는 open을 받아 버튼을 반환하는 함수입니다. aria-haspopup·aria-expanded·aria-controls를 실제 트리거에 전달합니다. KjunButton·KjunTooltip·Fragment·표시용 DOM wrapper를 지원하며 사용자 정의 버튼은 받은 DOM 속성과 ref를 실제 버튼에 전달해야 합니다." }, "react");
set("Input Textarea SearchInput", {
  value: "소비자가 보유한 입력값입니다. 입력 변경 통지 결과를 이 값에 반영합니다.",
});
set("Select FilterGroup", {
  value: "단일 선택값 또는 복수 선택값 배열입니다. multiple에 맞는 형태로 전달합니다.",
});
set("Combobox", {
  value: "선택된 옵션의 실제 값입니다. 숫자 0도 유효한 선택값입니다. 검색 초안은 선택을 확정할 때만 value 변경으로 통지하고, Escape·바깥 클릭·필드 이탈로 닫으면 기존 선택 라벨을 표시합니다. 지우면 null을 전달합니다.",
});
set("Select", {
  options: "문자열·숫자 또는 labelKey·valueKey로 읽을 객체 목록입니다. 원시 숫자 0도 라벨과 지우기 동작을 유지합니다.",
  filterFn: { summary: "검색 일치 판정을 대신합니다. 주면 순위를 매기지 않고 원래 순서를 유지합니다. 서버 검색만 쓰려면 () => true를 넘깁니다." },
  searchKeys: { default: "[]", summary: "label 외에 검색할 옵션 필드입니다. 기본 검색은 label이 검색어로 시작하는 항목, label에 포함된 항목, 이 필드에 포함된 항목 순으로 정렬합니다." },
});
set("Combobox", {
  filterFn: { summary: "검색 일치 판정을 대신합니다. 주면 순위를 매기지 않고 원래 순서를 유지합니다. 서버에서 받은 후보를 그대로 보이려면 () => true를 넘깁니다." },
  searchKeys: { default: "[]", summary: "label 외에 검색할 옵션 필드입니다. 목록을 연 뒤 입력하면 label이 검색어로 시작하는 항목, label에 포함된 항목, 이 필드에 포함된 항목 순으로 정렬합니다. 입력 전에는 모든 옵션을 보여 줍니다." },
  loading: "후보를 불러오는 중입니다. 목록 자리에 검색 중 행을 보여 주고 옵션 선택과 Enter를 막습니다. onSearch로 후보를 받아 올 때 씁니다.",
});
set("Combobox", { renderOption: "옵션 내용을 바꿉니다. 두 번째 인자는 현재 선택된 옵션인지 여부이며, 선택 표시 체크는 함께 그려집니다." }, "react");
set("Combobox", { renderOption: "옵션 내용을 바꿉니다. 두 번째 인자는 현재 선택된 옵션인지 여부이며, 선택 표시 체크는 함께 그려집니다." }, "native");
for (const platform of ["react", "native"]) set("Combobox", {
  options: "검색 후보입니다. 같은 선택값·라벨을 가진 옵션 객체를 다시 만들어도 검색 초안을 유지합니다. 선택값이나 선택 라벨이 바뀌면 표시값을 동기화합니다.",
}, platform);
set("Input Textarea", {
  variant: { default: "\"default\"", summary: "plain은 배경, 좌우 테두리, 좌우 여백을 빼서 글자가 주변 글과 같은 선에 놓이게 합니다. 문서 제목이나 메모 본문처럼 화면 자체가 편집 영역인 자리에만 씁니다. 키보드 포커스 링은 유지하고, 오류는 테두리 없이 아래 문구로 표시합니다." },
});
set("Input", {
  onEnter: "조합 중이 아니고 onKeyDown에서 preventDefault로 소비하지 않은 Enter에 한 번 호출합니다. 한글 조합 확정은 제출로 처리하지 않습니다.",
}, "react");
set("Input Textarea DatePicker", {
  value: "현재 입력값입니다. null은 부모 값을 바꾸거나 update:modelValue를 내보내지 않고 빈 필드로 표시합니다. 직접 입력·날짜 선택은 문자열, 지우기는 빈 문자열을 전달합니다. Input의 숫자 0은 그대로 표시합니다.",
}, "vue3");
set("IconToggle", {
  ariaLabel: "버튼의 접근성 이름입니다. 대신 일반 aria-label 또는 텍스트 요소를 참조하는 aria-labelledby를 전달할 수 있습니다. 이름이 없으면 개발 모드에서 경고합니다.",
  tooltip: "기본값은 접근성 라벨의 텍스트입니다. aria-labelledby는 참조 요소의 텍스트를 읽습니다. 별도 도움말을 지정하거나 빈 문자열로 툴팁을 끌 수 있습니다.",
}, "vue3");
set("IconToggle", {
  ariaLabel: "버튼의 접근성 이름입니다. 대신 일반 aria-label 또는 텍스트 요소를 참조하는 aria-labelledby를 전달할 수 있습니다. 이름이 없으면 개발 모드에서 경고합니다.",
  tooltip: "기본값은 접근성 라벨의 텍스트입니다. aria-labelledby는 참조 요소의 텍스트를 읽습니다. 별도 도움말을 지정하거나 빈 문자열로 툴팁을 끌 수 있습니다.",
  onClick: "버튼의 클릭 이벤트를 onToggle 다음에 전달합니다.",
}, "react");
set("CopyButton", {
  onClick: "버튼의 클릭 이벤트를 먼저 전달합니다. preventDefault하면 복사하지 않습니다.",
}, "react");
set("RefreshButton", {
  onRefresh: "새로고침을 요청합니다. Promise를 반환하면 끝날 때까지 loading으로 표시하고, 반환하지 않으면 loading은 앱이 정합니다. 실패한 Promise는 표시를 멈춘 뒤 그대로 다시 던집니다.",
});
set("RefreshButton", {
  onRefresh: "@refresh로 연결하는 새로고침 핸들러입니다. Promise를 반환하면 끝날 때까지 loading으로 표시하고, 반환하지 않으면 loading은 앱이 정합니다. 실패한 Promise는 표시를 멈춘 뒤 그대로 다시 던집니다.",
}, "vue3");
set("ButtonGroup", {
  options: "선택할 수 있는 옵션 배열입니다. icon이 있는 옵션에 iconOnly를 켜면 높이와 같은 너비의 정사각형 칸에 아이콘만 그리고, label은 접근성 이름과 툴팁이 됩니다. 글자 칸과 한 그룹에 섞을 수 있습니다.",
});
set("ButtonGroup RadioGroup", {
  value: "현재 선택한 옵션의 값입니다. 변경 결과를 소비자 상태에 반영합니다.",
});
set("Tabs", { value: { summary: "활성 탭 이름은 소비자가 소유하며 변경 요청을 value에 반영합니다.", details: [
  { label: "빈 값의 초기 선택", text: "value가 빈 문자열이면 첫 활성 항목의 도착·변경을 감지하여 선택을 요청합니다. items와 복합 TabPane 모두 지원합니다. 같은 빈 값 기간에 같은 후보는 한 번만 요청하며 객체 재생성·부모의 거절로 반복하지 않습니다. 비어 있지 않은 부모 값은 자동 교체하지 않습니다." },
  { label: "통지 순서", text: "초기 선택과 사용자 선택 모두 Vue update:modelValue → change, React·Native onValueChange → onChange 순서입니다. 부모가 비어 있지 않은 값을 지정한 뒤 다시 빈 값으로 초기화하면 초기 선택을 다시 요청할 수 있습니다." },
] } });
set("TabPane", { disabled: "탭 선택을 비활성화합니다. 부모 Tabs가 속성 변경을 따라 탭 목록을 갱신합니다." }, "vue3");
set("Pagination", {
  showSizeSelector: "페이지당 항목 수 선택기를 표시합니다. 전체 페이지가 0개나 1개여도 선택기를 유지합니다.",
  showInfo: "전체 행이 있으면 현재 표시 범위와 전체 행 수를 표시합니다. 한 페이지일 때도 유지합니다.",
});
set("DatePicker", {
  value: "현재 선택 날짜입니다. YYYY-MM-DD 문자열이며 비어 있으면 빈 문자열입니다.",
});
set("DateRangePicker", {
  value: { type: "{ start: string; end: string }", summary: "현재 기간입니다. 시작일·종료일을 YYYY-MM-DD 문자열로 담고, 비어 있으면 빈 문자열입니다." },
  modelValue: { type: "{ start: string; end: string }", summary: "현재 기간입니다. 시작일·종료일을 YYYY-MM-DD 문자열로 담고, 비어 있으면 빈 문자열입니다." },
});
set("DatePicker DateRangePicker", {
  min: "선택 가능한 가장 이른 날짜(YYYY-MM-DD)입니다. 그보다 앞선 날짜는 흐린 취소선으로 보이고 고를 수 없습니다.",
  max: "선택 가능한 가장 늦은 날짜(YYYY-MM-DD)입니다. 그보다 뒤의 날짜는 흐린 취소선으로 보이고 고를 수 없습니다.",
  readOnly: "값을 보여 주기만 하고 달력을 열지 않습니다.",
  id: "트리거 버튼의 id입니다. 바깥 <label for>와 연결할 때 쓰며, 생략하면 FormGroup의 id를 씁니다.",
  name: "폼 제출용 숨은 input의 이름입니다. DatePicker는 날짜, DateRangePicker는 'start/end' 문자열을 제출합니다.",
});
set("DatePicker DateRangePicker", {
  weekStart: { type: "0 | 1 | 2 | 3 | 4 | 5 | 6", default: "0", summary: "주의 첫 요일입니다. 0은 일요일, 1은 월요일입니다. 요일 머리글과 Home·End 이동이 함께 바뀝니다." },
  markSunday: { default: "true", summary: "일요일을 danger 역할로 칠합니다. 한국 달력 관례를 따르는 기본값이며, 끄면 일요일도 다른 요일과 같은 색입니다." },
  markSaturday: { default: "true", summary: "토요일을 info 역할로 칠합니다. 끄면 토요일도 다른 요일과 같은 색입니다." },
  isDateUnavailable: { type: "(iso: string) => boolean", summary: "min·max 안에서 고를 수 없는 날짜(휴일·마감일 등)를 앱이 알려 줍니다. 그런 날은 흐린 취소선으로 보이고, 방향키로는 지나갈 수 있지만 고를 수 없습니다. 기간은 이런 날을 가로지를 수 없어 그 너머를 고르면 거기서 새 기간을 시작합니다." },
});
set("DateRangePicker", {
  presets: { type: "{ label: string; value: { start: string; end: string } }[]", summary: "날짜 위에 칩으로 보이는 미리 정한 기간입니다(예: 최근 7일). 누르면 초안 기간이 바뀌고 적용으로 확정합니다. 순서가 뒤집히거나 범위를 벗어난 값은 정리해서 씁니다." },
  autoApply: { default: "false", summary: "두 번째 날짜를 고르는 즉시 확정하고 닫습니다. 적용 버튼은 보이지 않습니다." },
  minDays: { type: "number", summary: "고를 수 있는 가장 짧은 기간(양 끝 포함 일수)입니다. 시작일을 고른 동안 더 짧아지는 날은 흐리게 보이고, 누르면 그 날에서 새 기간을 시작합니다. 바닥에 길이 안내가 보입니다." },
  maxDays: { type: "number", summary: "고를 수 있는 가장 긴 기간(양 끝 포함 일수)입니다. 시작일을 고른 동안 더 길어지는 날은 흐리게 보이고, 누르면 그 날에서 새 기간을 시작합니다. 바닥에 길이 안내가 보입니다. value와 presets에는 적용하지 않습니다." },
});
set("DatePicker DateRangePicker", {
  open: { type: "boolean", summary: "달력이 열려 있는지 앱이 정합니다(Vue는 v-model:open). 생략하면 필드가 직접 관리합니다. 주면 onOpenChange에서 값을 바꿔야 열리고 닫히며, disabled면 열리지 않습니다." },
  onOpenChange: { type: "(open: boolean) => void", summary: "트리거·Escape·바깥 누르기·날짜 확정으로 열림 상태가 바뀌어야 할 때 호출합니다." },
});
set("Select", { readOnly: { default: "false", summary: "값을 보여 주기만 하고 목록을 열거나 지우지 않습니다. 트리거는 초점을 받고 aria-readonly로 알립니다." } });
for (const platform of ["vue3", "react"]) set("DropdownItem", {
  href: "항목을 링크로 만듭니다. 고르면 브라우저가 이 주소로 이동하고 메뉴는 닫힙니다.",
  target: "href 링크를 열 대상입니다(예: _blank).",
}, platform);
set("Accordion", {
  headingLevel: { type: "2 | 3 | 4 | 5 | 6 | false", default: "3", summary: "각 헤더를 감쌀 제목 수준입니다. 화면 낭독기의 제목 탐색에 헤더가 들어갑니다. false면 제목으로 감싸지 않습니다." },
  region: { default: "true", summary: "펼친 본문을 헤더 이름의 영역(region)으로 알립니다. 항목이 많아 영역 목록이 길어지면 false로 끄세요." },
});
set("AccordionItem", { ariaLabel: "헤더의 접근성 이름입니다. header에 글자가 아닌 내용을 넣을 때 주세요. 생략하면 보이는 헤더를 읽습니다." });
set("Breadcrumb", { items: { type: "{ label: string; to?: string; icon?: string; current?: boolean }[]", summary: "경로 단계입니다. to가 있으면 링크입니다. 현재 페이지는 기본으로 to가 없는 마지막 단계이며, current로 직접 정할 수 있습니다(링크인 현재 단계도 aria-current로 알립니다). 빈 배열이면 아무것도 그리지 않습니다." }, maxItems: "긴 경로를 접습니다. 첫 단계와 마지막 maxItems - 1개 단계만 보이고, 사이 단계는 \"…\" 버튼의 메뉴로 엽니다. 2 이상일 때 적용합니다." });
set("ScrollFade", { ariaLabel: "스크롤 영역의 이름입니다. 주면 웹은 초점을 받는 영역(region)이 되어 안에 초점 받을 요소가 없어도 키보드로 스크롤할 수 있습니다." });
set("ScrollFade", { fadeColor: { type: "ColorValue", default: "colors.surface", summary: "가장자리가 흐려지며 섞일 색입니다. 스크롤 영역 뒤의 바탕색을 주세요." } }, "native");
set("Badge", {
  count: "children 대신 보일 숫자입니다. max보다 크면 \"99+\"처럼 보이고, 0 이하면 배지를 그리지 않습니다. 숫자 배지는 내비게이션 배지처럼 완전한 알약이고 최소 폭이 높이와 같아 한 자리 수는 원으로 그립니다.",
  dot: "글자 앞에 톤 색 점을 그립니다. 글자 없이 점만 주면 채움과 여백 없이 8px 점만 그리므로 label로 뜻을 함께 주세요.",
  max: { default: "99", summary: "전부 보여 줄 가장 큰 숫자입니다. 넘으면 max+로 보입니다." },
  label: "화면 낭독기가 읽을 배지의 뜻입니다(예: 읽지 않은 알림 3개). 주면 그린 글자는 낭독기에서 숨깁니다. 점만 있는 배지에는 꼭 주세요.",
});
set("Badge", { accessibilityLabel: "Native 전용 별칭입니다. 그린 글자 대신 화면 낭독기가 읽을 이름으로 label과 같은 일을 하며 label보다 우선합니다. 세 플랫폼에 같은 코드를 쓰려면 label을 쓰세요.", testID: "테스트에서 배지를 찾는 ID입니다." }, "native");
// Progress documents its own value (null is missing data) above.
set("AnimatedNumber PriceCell SignedValue Deviation ProgressCell HeatmapCell", {
  value: "표시·계산에 사용할 숫자 값입니다. 입력 편집이나 변경 통지는 제공하지 않습니다.",
});
set("CopyButton", { value: "클립보드에 복사할 문자열입니다." });
set("Accordion", { multiple: { summary: "여러 항목을 동시에 펼치도록 허용합니다.", details: [
  { label: "동적 변경", text: "false로 전환하면 현재 열린 항목 중 마지막으로 연 항목만 유지합니다. 다시 true로 바꿔도 닫힌 항목을 복원하지 않습니다. 제거된 자식은 열린 상태 목록에서도 정리합니다." },
  { label: "기본 펼침", text: "단일 모드에서 여러 자식이 defaultOpen이면 첫 등록 항목만 엽니다. defaultOpen은 최초 등록용이며 이후 상태 제어 prop이 아닙니다." },
] } });
set("Dropdown", { onClose: { summary: "실제 닫힘 전이에 한 번 호출합니다.", details: [
  { label: "선택 순서", text: "항목 action → onClose 한 번 순서입니다. 같은 이벤트의 중복 닫힘 요청과 퇴장 애니메이션 완료는 추가 통지를 만들지 않습니다." },
] } }, "react");
set("Card", {
  surface: "표면의 배경·전경·테두리 색상 역할을 선택합니다. 모두 단색 채움이고 glass만 반투명입니다. default가 아닌 색 표면(muted·accent·success·warning·danger·subtle·brand) 안의 배지는 surface 색 바탕으로 그려 표면과 구분합니다. brand 표면 안의 primary·link 버튼은 brand 색 대신 brandAction 역할(기본: onBrand 바탕·brand 글자, link는 onBrand 글자)로 그려 표면에 묻히지 않게 합니다. muted는 흰(surface) 영역 안에 놓을 때 쓰고, 페이지 바탕 위에는 default를 씁니다. border·elevation은 독립적으로 적용됩니다.",
  padding: "헤더·본문·푸터의 기본 여백입니다. none/sm/md/lg이며 기본값은 md입니다. 화면 폭에 따라 자동 변경되지 않습니다.",
  bodyPadding: { default: "padding 상속", summary: "본문 여백만 바꿉니다. none이면 표나 목록을 카드 가장자리까지 채우면서 헤더·푸터 여백을 유지합니다." },
  radius: "공통 모서리 스케일 none/sm/md/lg/xl(0·8·12·16·24)을 선택합니다. 기본값은 md이며 미디어 상단 모서리에도 적용됩니다.",
  border: "모든 surface에서 외곽 테두리의 표시 여부를 결정합니다. 기본값 false이며 표면이 이 값을 덮어쓰지 않습니다.",
  dividers: "헤더와 본문, 본문과 푸터 사이의 구분선을 표시합니다. 각 선 양쪽에 해당 영역의 여백을 유지합니다.",
});
set("Card", {
  header: "제목·설명 영역을 교체합니다. headerActions와 함께 사용할 수 있습니다.",
  headerActions: "헤더 오른쪽 행동입니다. 제목 첫 줄에 맞춰 놓이고(제목이 두 줄이어도), 제목이 160px 이상 남으면 배지 같은 짧은 표시는 제목 줄에 그대로 두고, 그보다 넓은 행동은 다음 줄 시작으로 내려가며 긴 Button 문구는 카드 안에서 줄바꿈합니다. 제목이나 header가 없으면 본문과 같은 줄 끝에 세로 가운데로 두고(본문과 16px), 본문이 160px보다 좁아지면 본문 위 줄 끝으로 올립니다. 미디어나 footer가 있으면 헤더 줄 끝에 둡니다.",
  media: "헤더 위(mediaPosition start면 내용 옆)에 표시하는 미디어입니다. 미디어만 있을 때는 아래 모서리까지 카드 반경에 맞춰 자릅니다.",
  title: "카드 제목입니다. 아이콘이나 강조한 숫자가 필요하면 노드를 넣습니다. pressable 카드에 노드 제목을 쓰면 ariaLabel을 함께 줍니다.",
}, "react");
set("Card", {
  header: "제목·설명 영역을 교체합니다. headerActions와 함께 사용할 수 있습니다.",
  headerActions: "헤더 오른쪽 행동입니다. 제목 첫 줄에 맞춰 놓이고(제목이 두 줄이어도), 제목이 160px 이상 남으면 배지 같은 짧은 표시는 제목 줄에 그대로 두고, 그보다 넓은 행동은 다음 줄 시작으로 내려가며 긴 Button 문구는 카드 안에서 줄바꿈합니다. 제목이나 header가 없으면 본문과 같은 줄 끝에 세로 가운데로 두고(본문과 16px), 본문이 160px보다 좁아지면 본문 위 줄 끝으로 올립니다. 미디어나 footer가 있으면 헤더 줄 끝에 둡니다.",
  media: "헤더 위(mediaPosition start면 내용 옆)에 표시하는 미디어입니다. 미디어만 있을 때는 아래 모서리까지 카드 반경에 맞춰 자릅니다.",
  title: "카드 제목입니다. 아이콘이나 강조한 숫자가 필요하면 노드를 넣습니다. pressable 카드에 노드 제목을 쓰면 ariaLabel을 함께 줍니다.",
}, "native");
set("Select FilterGroup", { multiple: "복수 선택을 사용합니다. value도 배열 형태로 전달하세요." });
set("Icon", {
  name: "패키지에 포함된 아이콘 이름입니다.",
  size: "아이콘의 표시 크기입니다. 웹 CSS 길이와 Native 숫자 크기를 구분합니다.",
  ariaLabel: "혼자서 뜻을 전하는 아이콘의 이름입니다. 주면 화면 낭독기가 이미지로 읽고, 생략하면 장식으로 숨깁니다. 웹은 aria-label 속성도 같은 뜻으로 받습니다.",
  min: "SVG 기본 요소에 전달되는 min 속성입니다. 아이콘 크기를 제한하지 않습니다.",
  max: "SVG 기본 요소에 전달되는 max 속성입니다. 아이콘 크기를 제한하지 않습니다.",
  type: "SVG 기본 요소에 전달되는 type 속성입니다. 아이콘 종류는 name으로 선택합니다.",
});
set("ScrollFade", { direction: "내용이 스크롤되는 방향입니다. horizontal(기본)은 좌우, vertical은 위아래로 스크롤하며 그 방향의 양 끝을 흐리게 합니다. vertical은 높이(style·class)가 있어야 스크롤됩니다." });
set("FormSkeleton", {
  columns: "폼 스켈레톤을 배치할 열 수입니다.",
  size: { default: "md", summary: "대상 Input과 같은 크기입니다. sm 32px, md 40px, lg 48px이며 모서리도 공유합니다." },
  fields: "필드 라벨 또는 { label, height } 배열입니다. 개별 height가 size와 multiline보다 우선합니다.",
  multiline: "개별 높이를 지정하지 않은 필드를 3줄 Textarea와 같은 높이(sm 92px, md 100px, lg 108px)로 표시합니다.",
});
set("Skeleton", {
  columns: "표 형태 스켈레톤의 열 수입니다.",
  type: { default: '"text"', summary: "text는 본문 줄, line은 한 줄, card는 기본 Card, stat은 KpiRow 항목, table·avatar·block은 표·아바타·블록 자리입니다. 글자 자리 막대는 그 글자 역할 줄 높이의 절반이며 줄 상자 가운데에 놓입니다." },
  role: { summary: "type=\"line\"의 글자 역할입니다(예: caption, numberSm, displaySm). 웹에서 생략하면 주변 글자의 줄 높이를 따르고, Native는 기본 body입니다." },
  loadingText: { summary: "화면 낭독기에 알릴 로딩 문구입니다. 주면 status 역할로 한 번 알리고 화면에는 보이지 않습니다. DataState 안에서는 중복 알림을 피하도록 생략합니다." },
});
set("FormSkeleton ListSkeleton", { loadingText: { summary: "화면 낭독기에 알릴 로딩 문구입니다. 주면 status 역할로 한 번 알리고 화면에는 보이지 않습니다. DataState 안에서는 중복 알림을 피하도록 생략합니다." } });
set("ListSkeleton", {
  variant: { default: '"market"', summary: "market·compact·notification은 시세 목록 행, row는 KjunListRow 행(제목·설명 줄, 글자 시작선부터 긋는 구분선)입니다." },
  description: { default: "true", summary: "row 변형에서 설명 줄을 그립니다." },
  trailing: { default: '"value"', summary: "row 변형의 행 끝 자리입니다. value는 값, switch는 스위치, chevron은 화살표 자리이며 quote=false면 비웁니다." },
});
set("MarketTableSkeleton", {
  columns: "MarketTable과 동일한 열 구성입니다. 기본 폭은 이름 240px·기타 160px·액션 96px이며 지정한 너비를 우선합니다.",
});
set("ListSkeleton Skeleton MarketTableSkeleton", { rows: "자리 표시자로 출력할 행 수입니다." });
set("Textarea", {
  rows: { default: "3", summary: "처음 표시하는 행 수이자 최소 높이입니다." },
  maxRows: { default: "6", summary: "내용에 맞춰 늘어나는 최대 행 수입니다. 넘으면 필드 안에서 스크롤합니다. rows와 같게 두면 높이가 고정됩니다. \"none\"이면 한도 없이 글 길이만큼 늘어나고 필드 안에서는 스크롤하지 않습니다(노트·문서 본문)." },
  resize: { default: '"none"', summary: "웹에서 사용자가 크기를 직접 조절하는 방향입니다. 필드가 내용에 맞춰 늘어나므로 기본은 none입니다. vertical·both면 사용자가 끈 높이를 지키도록 내용에 맞춰 늘어나지 않습니다." },
  maxLength: "입력할 수 있는 최대 글자 수(UTF-16 단위)입니다. showCount와 함께 쓰면 \"길이/최대\"로 표시하고, 값이 넘치면 위험 색과 오류 상태로 표시합니다.",
  showCount: { default: "false", summary: "필드 안 오른쪽 아래에 글자 수를 표시합니다. 화면 낭독기에는 필드 설명으로 연결합니다." },
  actions: "작성기형: 필드 안 아래 줄 앞쪽에 둘 첨부·언급 같은 컨트롤입니다(Vue는 actions 슬롯). 소비자가 기능을 연결합니다.",
  submitLabel: "작성기형: 지정하면 필드 안 아래 줄 끝에 보내기 버튼을 두고 이 문구를 접근성 이름으로 씁니다. 내용이 비었거나 maxLength를 넘거나 비활성·읽기 전용이면 누를 수 없습니다.",
  onSubmit: "보내기 버튼이나 웹의 Ctrl/⌘+Enter로 보내기를 요청합니다. 인자는 현재 값이며, 입력을 비우는 것은 소비자가 합니다.",
});
set("MarketCards MarketSimpleList MarketTable", {
  rows: "현재 표시할 시장 행 객체 배열입니다.",
  pagination: "시장 목록의 페이지 설정 { page, size, total }입니다.",
  sortKey: "현재 정렬 열·지표를 표시하는 키입니다. 실제 정렬 데이터는 소비자가 제공합니다.",
});
delete overrides.KjunMarketSimpleList.common.sortKey;
set("Sparkline", { data: "시간 순서대로 연결할 숫자 배열입니다. 데이터 정렬은 소비자가 합니다." });
set("FormActions", {
  loading: "확인 버튼의 라벨 공간과 너비·높이를 유지하고 중앙에 스피너를 표시합니다. 취소 비활성은 cancelDisabled로 별도 제어합니다.",
  variant: "확인 버튼의 강조 스타일입니다.",
  size: { default: "lg", summary: "확인·취소 버튼의 최소 높이입니다. sm=32px, md=40px, lg=48px이며 긴 라벨은 줄바꿈에 따라 높이가 늘어납니다. 지정하지 않으면 감싼 Popover(sm)·Alert의 버튼 크기를 따르고, 그 밖에서는 lg입니다." },
  confirmText: "확인 버튼의 문구입니다. 긴 문구는 영역 안에서 줄바꿈하며 두 버튼이 한 줄에 들어가지 않으면 전체 너비로 세로 배치합니다.",
  cancelText: "취소 버튼의 문구입니다. 좁은 폭에서도 취소 → 확인 순서와 8px 간격을 유지합니다.",
});
set("Alert", { type: "알림의 의미 색상(info·success·warning·danger 등)을 선택합니다." });
set("Input Button", { type: "기본 입력 또는 버튼 요소에 전달할 HTML 동작 유형입니다." }, "react");
set("SearchInput", {
  itemKey:
    "자동 완성 결과의 반복 렌더링 key로 읽을 필드입니다. 모든 플랫폼에서 기본값은 id이며 string·number 식별자를 사용합니다.",
});
set("Modal", {
  ariaLabel: "대화상자의 접근성 이름입니다. 명시하면 시각적 제목보다 우선합니다. 헤더를 숨겨도 이름 또는 title을 유지하며, 둘 다 없으면 '대화상자'를 사용합니다.",
  returnFocus: "닫힘 애니메이션이 끝난 뒤 초점을 보낼 요소입니다. 요소·ref·요소를 돌려주는 함수를 받으며 닫힐 때 최신 값을 읽습니다. 반응형 헤더처럼 버튼이 교체되면 ref나 함수로 현재 버튼을 지정하세요. 대상이 없거나 제거되면 원래 열기 버튼, 남아 있는 상위 창 순서로 복귀합니다. React·Vue 웹 전용입니다.",
});
set("Dropdown", {
  trigger: "메뉴를 여는 단일 버튼 요소입니다. id·aria-haspopup·aria-expanded·aria-controls와 disabled를 실제 버튼에 전달합니다. 사용자 정의 버튼은 받은 속성을 DOM 버튼에 전달해야 합니다. KjunTooltip으로 감싼 버튼도 지원합니다.",
  triggerId: "실제 트리거 버튼의 id입니다. 생략하면 버튼의 기존 id 또는 자동 생성 id를 사용하며 메뉴의 접근성 이름에 연결합니다.",
}, "react");

set("CollectionMark", {
  active: "등록·관심 여부를 표시합니다. 이 컴포넌트는 변경 행동을 제공하지 않습니다.",
  label: { default: '"즐겨찾기" · "관심"', summary: "켜진 표시를 화면 낭독기가 읽는 이름입니다. 생략하면 kind에 따라 메시지의 favoriteMark·interestMark를 씁니다. 꺼진 표시는 그림으로만 두고 읽지 않습니다." },
});
set("KpiHero", { value: "대표 지표의 현재 값입니다. 계산과 데이터 조회는 소비자가 수행합니다." });
set("Text", {
  variant: { default: '"body"', summary: "글자 역할입니다. pageTitle·sectionTitle·cardTitle·bodyLg·body·bodyLong·label·labelStrong·meta·caption·captionStrong·숫자(number·display) 역할의 크기·줄 높이·굵기를 tokens.typography에서 가져옵니다. inherit는 문장 일부만 색을 바꿀 때 쓰며 둘러싼 글자의 크기·굵기를 그대로 따릅니다." },
  tone: { default: '"default"', summary: "글자색 역할입니다. default는 웹에서 감싼 영역의 글자색을 따르고 Native에서는 text 색입니다. secondary·tertiary·disabled는 같은 이름의 text 색 역할, brand·danger·success·warning·info는 같은 이름의 색 역할입니다. onBrand·onDanger·onSuccess·onWarning은 그 색으로 채운 면 위의 글자색이고, inverse는 onBrand의 이전 이름입니다." },
  as: { summary: "웹 문서 구조의 태그입니다. h1~h6·p·span·div와 dt·dd·li·label·legend·figcaption·time·strong·em을 받습니다. 생략하면 pageTitle은 h1, sectionTitle은 h2, cardTitle은 h3, 숫자 역할과 inherit는 span, 나머지는 p입니다. 크기는 variant가 정합니다." },
  align: { summary: "글자 정렬(start·center·end)입니다. 생략하면 부모를 따릅니다." },
  maxLines: { summary: "이 줄 수를 넘으면 말줄임표로 줄입니다. 전체 문장은 그대로 남아 보조 기술이 읽습니다. 1보다 작은 값은 줄이지 않습니다." },
  numeric: { default: "false", summary: "숫자를 고정폭으로 그려 세로로 나열한 금액의 자릿수를 맞춥니다. 크기·굵기는 variant 그대로입니다." },
  decoration: { summary: "lineThrough는 할인 전 가격처럼 글자에 취소선을 긋습니다." },
  expandable: { default: "false", summary: "maxLines와 함께 쓰면 글 아래에 '더보기' 버튼을 두어 나머지를 펼치고, 펼친 뒤에는 '접기'로 바뀝니다. 버튼은 글이 실제로 줄어들었을 때(또는 펼쳐 있을 때)만 보이며 aria-expanded로 상태를 알립니다. 글과 버튼을 감싸는 블록이 생기고, id·class·style·aria는 글 요소에 그대로 붙습니다. 문구는 Provider의 messages(showMoreText·showLessText)로 바꿉니다." },
  expanded: { summary: "expandable 글을 펼쳤는지 여부입니다. 생략하면 컴포넌트가 직접 관리하고, 주면 onExpandedChange(Vue는 v-model:expanded)와 함께 앱이 정합니다." },
  onExpandedChange: { summary: "더보기·접기 버튼을 눌러 펼침 상태가 바뀔 때 다음 값을 받습니다." },
  title: { summary: "브라우저 기본 툴팁입니다. maxLines로 줄인 문장의 전체 내용을 마우스로 확인할 때 씁니다. 터치 기기에서는 보이지 않습니다." },
  lang: { summary: "이 글자의 언어 코드입니다. 화면 언어와 다른 문장에 지정합니다." },
  dir: { summary: "글자 방향(ltr·rtl·auto)입니다." },
});
set("Stack", {
  gap: { default: '"md"', summary: "자식 사이 간격 단계입니다. xs·sm·smMd·md·lg는 space.stack(4·8·12·16·24px), sectionSm·sectionMd·sectionLg는 space.section(32·48·64px)이고 none은 0입니다. section-sm처럼 쓰던 이전 이름도 동작하며 개발 모드에서 한 번 알립니다. { base: \"sm\", medium: \"lg\" }처럼 객체를 주면 화면 폭에 따라 바뀝니다(compact 640·medium 768·wide 1024px 이상, 가장 넓은 단계가 이깁니다)." },
  align: { default: '"stretch"', summary: "자식의 가로 정렬입니다. stretch는 블록 자식이 폭을 채우고 버튼·배지·칩처럼 내용 폭인 컨트롤은 제 폭을 유지합니다(전체 폭 버튼은 block, 앱이 감싼 요소는 data-kjun-intrinsic). start·center·end는 모든 자식을 내용 폭으로 둡니다. { base: \"stretch\", medium: \"center\" }처럼 객체를 주면 화면 폭에 따라 바뀌어, direction과 함께 가로로 놓일 때의 정렬을 따로 정합니다." },
  justify: { default: '"start"', summary: "Stack이 자식보다 길 때 남는 길이의 분배(start·center·end·between)입니다. between은 첫 자식을 시작, 마지막 자식을 끝에 붙입니다. 묶음 사이를 벌리려면 KjunSpacer를 넣습니다. align처럼 화면 폭별 객체를 받습니다." },
  divider: { default: "false", summary: "자식 사이에 구분 요소를 넣습니다. true와 full은 divider 색 1px 선, inset은 dividerInset만큼 들여 시작하는 선, strong은 구획을 나누는 8px 바탕색 띠입니다. 선은 gap 가운데에 그려 자식 사이 거리가 gap 그대로이고, 띠는 gap에 두께를 더합니다. KjunSpacer 옆에는 그리지 않으며, 선은 Stack의 요소라 앱 자식의 스타일은 바뀌지 않습니다." },
  direction: { default: '"column"', summary: "자식을 세로(column)로 쌓을지 가로(row)로 놓을지 정합니다. { base: \"column\", medium: \"row\" }처럼 객체를 주면 화면 폭에 따라 바뀌어, 좁으면 세로·넓으면 가로인 카드를 컴포넌트 하나로 그립니다. 방향이 바뀌면 구분선도 따라 눕습니다." },
  padding: { summary: "안쪽 여백 단계입니다. sm·md·lg는 space.inset(12·16·24px)이고 none은 0입니다. 네 방향에 같은 값을 주며 gap처럼 화면 폭별 객체를 받습니다. 배경과 모서리는 앱이 정합니다." },
  paddingX: { summary: "좌우 여백 단계입니다. padding의 좌우만 바꿉니다." },
  paddingY: { summary: "위아래 여백 단계입니다. padding의 위아래만 바꿉니다." },
  dividerInset: { default: '"md"', summary: "divider=\"inset\"인 선이 시작하는 거리입니다. space.inset(sm 12·md 16·lg 24px) 단계입니다." },
  responsive: { default: '"viewport"', summary: "화면 폭별 객체가 무엇을 기준으로 바뀔지 정합니다. viewport는 화면(창) 폭이라 첫 화면부터 정확합니다. container는 Stack 자기 폭을 재서(웹 ResizeObserver, Native onLayout) 좁은 사이드바·Drawer 안에서도 맞는 단계를 고르며, 재기 전 첫 그림은 base입니다." },
  as: { default: '"div"', summary: "웹 태그(div·section·ul·ol·nav·header·footer·main·article·aside·form·fieldset)입니다. ul·ol은 목록 기호와 들여쓰기를, fieldset은 테두리를 지우며 자식은 li로 주세요. React에서는 태그의 속성(form의 onSubmit, fieldset의 disabled 등)과 ref 타입이 as를 따릅니다." },
});
set("Inline", {
  gap: { default: '"sm"', summary: "자식 사이 가로·줄 간격 단계입니다. xs·sm·md·lg는 space.inline(4·8·12·16px)이고 none은 0입니다. Stack처럼 화면 폭별 객체를 받습니다." },
  rowGap: { summary: "여러 줄로 넘어갔을 때 줄 사이 간격입니다. xs·sm·smMd·md·lg는 space.stack(4·8·12·16·24px), none은 0이고, 생략하면 gap과 같습니다. 가로(row)로 놓일 때만 쓰며, 화면 폭별 객체를 받습니다." },
  align: { default: '"center"', summary: "자식의 세로 정렬(start·center·end·baseline·stretch)입니다. 화면 폭별 객체를 받습니다." },
  justify: { default: '"start"', summary: "가로 분배(start·center·end·between)입니다. between은 양 끝에 붙입니다. 화면 폭별 객체를 받습니다." },
  wrap: { default: "true", summary: "줄 폭이 모자라면 다음 줄로 넘깁니다. false이면 한 줄을 유지합니다." },
  divider: { default: "false", summary: "자식 사이에 세로 구분선을 넣습니다. 종류와 간격 규칙은 Stack과 같습니다." },
  direction: { default: '"row"', summary: "자식을 가로(row)로 놓을지 세로(column)로 쌓을지 정합니다. { base: \"column\", medium: \"row\" }처럼 객체를 주면 화면 폭에 따라 바뀌어, 좁으면 세로·넓으면 가로인 카드를 컴포넌트 하나로 그립니다. 방향이 바뀌면 구분선도 따라 눕습니다." },
  padding: { summary: "안쪽 여백 단계입니다. sm·md·lg는 space.inset(12·16·24px)이고 none은 0입니다. 네 방향에 같은 값을 주며 gap처럼 화면 폭별 객체를 받습니다. 배경과 모서리는 앱이 정합니다." },
  paddingX: { summary: "좌우 여백 단계입니다. padding의 좌우만 바꿉니다." },
  paddingY: { summary: "위아래 여백 단계입니다. padding의 위아래만 바꿉니다." },
  dividerInset: { default: '"md"', summary: "divider=\"inset\"인 선이 시작하는 거리입니다. space.inset(sm 12·md 16·lg 24px) 단계입니다." },
  responsive: { default: '"viewport"', summary: "화면 폭별 객체가 무엇을 기준으로 바뀔지 정합니다. viewport는 화면(창) 폭이라 첫 화면부터 정확합니다. container는 Stack 자기 폭을 재서(웹 ResizeObserver, Native onLayout) 좁은 사이드바·Drawer 안에서도 맞는 단계를 고르며, 재기 전 첫 그림은 base입니다." },
  as: { default: '"div"', summary: "웹 태그입니다. Stack과 같은 태그를 받으며, ul·ol은 목록 기호와 들여쓰기를 지웁니다." },
});
set("Spacer", {
  style: { summary: "Native 바깥 스타일입니다. 길이는 Spacer가 남는 공간으로 정하므로 크기를 주지 않습니다." },
}, "native");
set("Tiles", {
  gap: { default: '"auto"', summary: "칸 사이 가로·세로 간격입니다. compact는 space.stack.md(16px), regular는 space.stack.lg(24px)이고, auto는 목록이 놓인 영역 폭이 768px보다 좁으면 compact, 넓으면 regular입니다." },
  minItem: { default: '"md"', summary: "칸의 최소 폭입니다(sm 160·md 240·lg 320px). 칸이 이보다 좁아지면 열을 줄이고, 1열에서는 영역 폭까지 줄어듭니다." },
  maxColumns: { default: "4", summary: "넓은 영역에서도 넘지 않는 최대 열 수(2·3·4)입니다." },
});
set("Tiles", { ariaLabel: "화면 낭독기가 읽는 목록 이름입니다." }, "native");
set("KpiHero", {
  asideMobile: { default: '"below"', summary: "좁은 화면(640px 이하)에서 aside를 변동선 아래 전폭으로 내립니다. hidden이면 숨깁니다." },
  deltaIcon: { default: "false", summary: "첫 번째 증감 숫자(deltaAbsolute, 없으면 deltaPercent) 앞에 방향 삼각형을 그리고 그 숫자의 부호를 뺍니다. 부호는 스크린 리더에 그대로 읽힙니다. deltaFormatter의 글자는 바꾸지 않습니다." },
  deltaPercent: "기준 대비 증감률입니다. 상승·하락 방향의 옅은 면을 깐 칩으로 표시하고, 표시 자릿수로 반올림해 0이면 중립 면과 중립 색을 씁니다.",
  value: "핵심 값입니다. null·undefined 또는 유한하지 않은 숫자면 missingText(기본 —)를 표시합니다. 숫자는 KjunProvider locale의 자릿수 형식을 따릅니다.",
  missingText: { default: '"—"', summary: "value가 없을 때 대신 표시할 글자입니다. 보조 지표 항목도 같은 missingText 필드를 받습니다." },
  deltaPercentDecimals: { default: "1", summary: "증감률의 소수 자릿수입니다. 증감 방향과 색은 이 자릿수로 반올림한 값으로 정하므로 0.04%는 기본값에서 중립, 2자리에서는 상승입니다." },
  masked: { default: "false", summary: "핵심 값·증감·보조 지표의 금액을 •••• 로 가리고 방향 색과 삼각형을 그리지 않습니다. 스크린 리더는 '숨김'(메시지 hiddenValue)을 읽습니다." },
});
set("KpiRow", {
  mobileSummary: { default: "true", summary: "좁은 화면에서 항목을 2열 요약으로 흐르게 합니다. mobileSecondary: true로 표시한 항목만 끝의 작은 인라인 줄로 내려가고, 홀수 개의 마지막 일반 항목은 전폭으로 마감합니다." },
  masked: { default: "false", summary: "숫자 값과 valueSegments를 •••• 로 가리고 방향 색을 칠하지 않습니다. 텍스트 값·배지·설명은 그대로 둡니다. 스크린 리더는 '숨김'을 읽습니다." },
});
set("KpiHero KpiRow", { surface: { default: '"card"', summary: "none이면 자체 카드 배경·패딩·반경을 그리지 않습니다. 카드·모달 안이나 모바일 전폭 목록에 넣을 때 표면이 겹치지 않게 합니다." } });
set("Table", { edgeInset: { default: "\"default\"", summary: "none이면 격자 표에서 첫 열의 시작 쪽 여백과 끝 열의 끝 쪽 여백을 없애, 표의 글자와 구분선이 주변 글과 같은 선에 놓입니다. 머리글·본문·묶음 제목·펼친 내용·요약·빈 상태에 모두 적용하고, 열 사이 여백과 카드·목록 배치는 그대로입니다. 줄무늬·선택·hover처럼 줄에 배경이 깔리는 표에서는 배경이 글자에 붙으므로 배경 없는 표에 씁니다." } });
set("Table MarketCards MarketSimpleList MarketTable", { skeleton: { default: "true", summary: "최초 로딩을 스켈레톤으로 표시합니다. false이면 DataState의 스피너와 loadingText를 표시합니다." } });
set("SignedValue", {
  format: { summary: "표시 형식입니다. percent는 값을 보이는 그대로 퍼센트로 표시합니다(2.35 → +2.35%). 비율(0.0235)을 가진 곳은 value * 100으로 넘기세요." },
});
set("PriceCell", {
  flashClass:
    "소비자가 지정한 웹 강조 클래스입니다. 가격 변화를 감지해 자동으로 넣고 빼지 않습니다.",
  status: "가격 뒤에 둘 상태 표시입니다. 문구와 배지 색은 앱이 정하고, KJUN은 가격 셀 뒤 6px 간격과 세로 가운데 정렬만 맡습니다(단독 가격 셀은 강조 배경용 좌우 8px 여백이 있어 숫자에서 14px, 시세 목록·표에서는 6px). 목록·표에는 xs KjunBadge를 권장합니다.",
});
set("MarketSimpleList MarketTable", { renderStatus: "행의 시세 상태(종가·지연 등)를 반환합니다. 목록은 등락률 앞, 표는 가격 칸 값 뒤에 둡니다. 문구와 배지 색은 앱이 정합니다." });
set("Progress", { label: "진행률의 제목입니다. showLabel과 관계없이 표시하며 showLabel은 백분율을 더합니다." });
set("Progress ProgressCell", {
  marker: "막대를 가로지르는 기준 눈금의 위치입니다. value와 같은 척도(0–max)로 줍니다(예: 예산 막대에서 오늘까지의 기준 비율). 눈금은 글자색 세로선이며 variant와 관계없이 색이 같습니다. Progress의 원형과 indeterminate·값 없음 상태에서는 그리지 않습니다.",
  markerLabel: "눈금의 뜻을 화면 낭독기에 알리는 문구입니다(예: \"오늘 기준 53%\"). 화면에는 보이지 않으므로, 보이는 설명은 subLabel이나 주변 글에 씁니다.",
});
set("Progress", { valueText: "값을 알 때 반올림한 백분율 대신 보여 주고 읽어 줄 문구입니다(예: \"37.4%\", \"3.2 / 8 GB\"). 막대 길이는 value와 max로 정합니다." });
set("MarketTableSkeleton", {
  alignClass: "선택적 웹 정렬 클래스 콜백입니다. 생략하면 columns[].align을 사용합니다.",
  widthClass: "선택적 웹 너비 클래스 콜백입니다. 생략하면 공통 열 배치를 사용합니다.",
});

set("Alert", {
  closable: "닫기 버튼을 표시합니다. sm은 24px, md는 28px이며 ✕가 본문 여백 끝에 맞춰집니다. 실행하면 내부 표시를 숨기고 닫힘을 통지합니다.",
  onClose: "알림을 내부에서 숨긴 다음 호출합니다. 외부 목록 정리는 소비자가 수행합니다.",
});
set("Button RefreshButton", {
  spinOnLoading: {
    default: "refresh 아이콘이면 true",
    summary:
      "로딩 중 앞 아이콘 회전 여부입니다. 생략하면 prefixIcon이 refresh인지에 따라 결정합니다.",
  },
});
set("RefreshButton", {
  mode: "icon은 정사각형 아이콘 버튼, text는 새로고침 아이콘과 라벨을 함께 표시합니다. 로딩 중에도 라벨을 유지합니다.",
  tooltip: { default: "icon 모드의 접근성 이름", summary: "공통 Tooltip으로 표시할 설명입니다. text 모드에서는 기본으로 생략하며 빈 문자열로 끌 수 있습니다." },
  spinOnLoading: { default: "true", summary: "일반 모션 설정에서 새로고침 아이콘을 회전합니다. false이거나 모션 감소 설정이면 별도 로더를 표시합니다." },
});

set("Popover", { noPadding: { default:"false", summary:"기본 16px 패딩과 12px 콘텐츠 간격을 제거합니다. 직접 구성하는 콘텐츠에 사용합니다." } });
set("Button", { loading: "진행 중인 작업을 표시합니다. 로딩 중에도 버튼은 포커스를 유지하고(aria-disabled·aria-busy) 누름·제출을 막습니다. 짧은 요청에서도 최소 400ms 동안 표시합니다. 실제 작업의 시작·완료는 소비자가 관리합니다." });
set("Button", { wrap: { default:"false", summary:"긴 라벨을 줄바꿈합니다. 크기별 높이는 최소 높이가 되고, 버튼이 칸을 넘지 않고 세로로 늘어납니다." } });
set("Button", {
  prefix: { type: "ReactNode", summary: "앞 아이콘 자리에 둘 노드입니다(다색 브랜드 로고, 작은 아바타). 크기별 아이콘 칸(md 16px)에 맞춰 가운데 놓고 넘치는 부분은 자릅니다. 여백·로딩 스피너 교체는 prefixIcon과 같고, prefixIcon보다 우선합니다. 비활성이면 웹은 회색·반투명, Native는 반투명으로 그립니다. Vue 3는 prefix 슬롯을 씁니다." },
  suffix: { type: "ReactNode", summary: "뒤 아이콘 자리에 둘 노드입니다. 칸·여백·로딩 규칙은 suffixIcon과 같고 suffixIcon보다 우선합니다. Vue 3는 suffix 슬롯을 씁니다." },
}, "react");
set("Button", {
  prefix: { type: "ReactNode", summary: "앞 아이콘 자리에 둘 노드입니다(다색 브랜드 로고, 작은 아바타). 크기별 아이콘 칸(md 16px)에 맞춰 가운데 놓고 넘치는 부분은 자릅니다. 여백·로딩 스피너 교체는 prefixIcon과 같고, prefixIcon보다 우선합니다. 비활성이면 반투명으로 그립니다." },
  suffix: { type: "ReactNode", summary: "뒤 아이콘 자리에 둘 노드입니다. 칸·여백·로딩 규칙은 suffixIcon과 같고 suffixIcon보다 우선합니다." },
}, "native");
set("RefreshButton", { wrap: { default:"false", summary:"Button의 wrap과 같습니다. 텍스트 모드의 긴 문구를 줄바꿈합니다." } });
set("Alert", { live: { summary:"보조기기 알림 방식입니다. assertive는 role=alert, polite는 status, off는 알리지 않습니다. 생략하면 danger는 alert, 나머지는 status입니다." } });
set("Tooltip", { open: { summary:"표시 여부를 직접 제어합니다. 생략하면 hover와 포커스로 열립니다. Vue는 v-model:open입니다." }, onOpenChange: { summary:"hover·포커스·Escape로 열림 상태가 바뀌어야 할 때 호출합니다. 제어형이면 open을 바꿔야 반영됩니다." } });
set("FormGroup", { labelHidden: { default:"false", summary:"라벨을 화면에서만 숨깁니다. 라벨은 계속 입력의 이름이 됩니다." } });
set("Select", { id: { summary:"트리거 버튼 id입니다. 바깥 <label for>가 이름을 붙일 수 있고, 생략하면 FormGroup의 id를 씁니다. id나 FormGroup이 있으면 placeholder를 이름으로 쓰지 않습니다." }, ariaDescribedBy: { summary:"추가 설명 요소 id입니다. FormGroup의 안내·오류와 중복 없이 합칩니다. Vue는 ariaDescribedby입니다." }, ariaDescribedby: { summary:"추가 설명 요소 id입니다. FormGroup의 안내·오류와 중복 없이 합칩니다." } });
set("Popover", { modal: { default:"true", summary:"false이면 페이지를 막지 않고, 열릴 때 초점을 가져가지 않습니다(focusOnOpen이면 가져감). 마지막 항목에서 Tab은 닫고 트리거 다음으로, 첫 항목에서 Shift+Tab은 트리거로 갑니다. 바깥을 누르거나 초점이 밖으로 나가면 닫히며 초점을 되돌리지 않고, Escape는 트리거로 돌아갑니다." } });
set("Popover", { header: { summary:"고정 머리글입니다. 본문만 스크롤하며 maxHeight는 머리글을 포함한 높이입니다. 웹에서는 ariaLabel이 없으면 대화상자 이름이 되고, Native는 ariaLabel을 지정해야 합니다. Vue는 header 슬롯을 씁니다." } });
set("Popover", { width: { default:"md", summary:"패널 너비 단계입니다. sm 192px·md 240px·lg 320px이며, matchTriggerWidth를 켜면 트리거 너비를 따릅니다." } });
set("Popover", { returnFocus: { summary:"닫힌 뒤 초점을 보낼 요소입니다. 요소·ref·요소를 돌려주는 함수를 받습니다. 대상이 없거나 문서에서 사라졌으면 트리거로 돌아갑니다." } });
set("Card", { dividers: { default:"false", summary:"헤더·본문·푸터 사이 구분선을 표시합니다. 구분선이 없으면 제목 묶음과 본문 사이는 padding보다 한 단계 좁게(sm 8·md 12·lg 16px), 본문과 푸터 사이는 padding만큼 띄웁니다." } });
set("ChartSkeleton", {
  kind: { default:'"frame"', summary:"frame은 격자선과 축 라벨 자리, donut은 글자 없는 고리, matrix는 rows×columns 셀을 그립니다. 데이터 모양을 흉내 내는 시리즈는 그리지 않습니다." },
  loadingText: { default:'"차트를 불러오는 중"', summary:"화면에는 그리지 않고 status 역할로 알리는 로딩 문구입니다(skeleton=false이면 스피너 아래에 표시). 빈 문자열이면 알림을 생략하므로, DataState 안에 넣을 때는 빈 문자열로 중복 알림을 피합니다." },
  skeleton: { default:"true", summary:"false이면 자리 표시 대신 같은 높이 안에 스피너와 loadingText를 표시합니다." },
  rows: { default:"8", summary:"matrix의 행 수입니다. 1–100 사이 정수로 내림합니다." },
  columns: { default:"14", summary:"matrix의 열 수입니다. 1–100 사이 정수로 내림합니다." },
});
set("Tabs", { density:"underline은 comfortable 44px·compact 32px, pills는 36px·28px 높이입니다. 두 변형 모두 14px 라벨을 사용합니다.", variant:"underline은 라벨 아래 2px 선택선, pills는 둥근 칩 모양으로 선택된 칩이 글자색으로 채워집니다.", fullWidth:"탭이 가로 폭을 똑같이 나눠 갖습니다. underline 선택선도 탭 폭 전체로 그어집니다." });

set("Card", { elevation: { summary: "콘텐츠 표면의 역할입니다. 기본 flat에는 그림자가 없고 raised에는 옅은 접촉 그림자가 있습니다.", details: [{ label: "행동", text: "Card 자체에는 hover 그림자·상승·pointer 효과가 없습니다. 행동은 내부 Button·Link에 연결합니다." }] } });
set("Card", { border: { default: "false", summary: "카드 안쪽에 0.5px 외곽선을 표시합니다. 기본은 선이 없으며, 테두리를 켜도 콘텐츠의 여백과 전체 크기는 바뀌지 않습니다." } });
set("Drawer", {
  safeArea: { default:"true", summary:"KjunProvider의 안전 영역을 반영합니다. 위·좌우 Drawer는 안쪽 위, 아래·좌우 Drawer는 footer 아래 여백으로 넣고, 시트는 반대쪽 안전 영역을 높이 상한에서 비워 둡니다. false면 모두 0입니다." },
  maxHeight: { default:"화면 높이 − 반대쪽 안전 영역 − 48px", summary:"위·아래 Drawer의 전체 높이 상한(px)입니다. 넘치면 본문만 스크롤하고 머리글·footer는 고정합니다. 좌우 Drawer에는 쓰지 않습니다." },
});
set("Drawer", { avoidKeyboard: { default:"true", summary:"화면 키보드가 패널을 가리지 않게 합니다. 아래 Drawer는 키보드 위로 올라가고 다른 위치는 높이를 줄입니다. 기기에서만 동작합니다." } }, "native");
// 0.13.0 additions.
set("Button RefreshButton", { shape: { default:'"default"', summary:'"circle"이면 아이콘만 있는 버튼을 원형으로 그립니다. 폭은 크기별 높이와 같고 모서리는 완전히 둥급니다. 글자가 있는 버튼에는 쓰지 않습니다. "pill"은 글자가 있는 버튼의 모서리를 완전히 둥글게 하고 폭은 그대로 둡니다(둥근 작업 바 안의 버튼).' } });
for (const platform of ["vue3", "react", "native"]) set("FormActions", { fill: "버튼이 줄 폭을 나눠 채웁니다. true는 두 버튼을 같은 폭으로, \"primary\"는 확인 버튼을 취소 버튼의 두 배 폭으로 둡니다. 두 버튼이 한 줄에 들어가지 않아 세로로 쌓이면 어느 쪽이든 각 버튼이 줄 전체를 채웁니다." }, platform);
for (const platform of ["vue3", "react"]) set("FormActions Modal", { form: "페이지의 다른 곳에 있는 <form>의 id입니다. 확인 버튼이 그 폼을 제출하고, 입력칸에서 Enter를 눌러도 제출됩니다. 모달 본문의 폼에 숨은 제출 버튼을 둘 필요가 없습니다. 저장은 폼의 submit 이벤트에서 처리하세요." }, platform);
set("ListRow", { expanded: { summary: "행이 자기 내용을 펼치게 합니다. 행 머리가 버튼이 되어 누르면 다음 상태를 알리고(React·Native onExpandedChange, Vue v-model:expanded), 끝에 아래 방향 꺾쇠가 붙어 펼치면 위로 뒤집힙니다. 펼친 내용은 제목이 시작하는 선에서 시작합니다. href·checked·selected·chevron과 함께 쓰지 않습니다." } });
for (const platform of ["react", "native"]) set("ListRow", {
  onExpandedChange: "펼침 상태를 바꾸려 할 때 다음 값으로 호출합니다. 받은 값을 expanded에 반영합니다.",
  expandedContent: "펼친 동안 행 아래에 보이는 내용입니다. 버튼 바깥이므로 버튼·링크를 넣을 수 있습니다.",
}, platform);
set("ListRow", { emphasized: { default: "false", summary: "목록이 향하는 값(합계·잔액·예상 수령액 등)을 강조합니다. 제목은 글자색 600, 값은 큰 숫자체(20/28/700)로 키우며 색은 바꾸지 않습니다. 한 섹션에 하나, 많아도 둘까지 씁니다. details 섹션의 마지막 행이면 위에 8을 더 띄웁니다." } });
set("ListRow", { trailingPosition: { default: '"side"', summary: "끝 칸 값의 자리입니다. side는 글 전체 옆의 별도 열, title은 제목과 같은 줄, below는 제목 아래 자기 줄(글 폭 전체, 시작 정렬)입니다. below는 주소·메모처럼 긴 값에 씁니다. title이면 설명과 children이 값의 길이와 무관하게 글 폭 전체를 써서, 막대가 있는 행들의 끝선이 맞습니다." } });
for (const platform of ["vue3", "react"]) set("ListRow", {
  target: "링크 행을 여는 위치입니다. \"_blank\"이면 새 탭에서 열고 rel을 따로 주지 않으면 noopener noreferrer를 붙입니다.",
  rel: "링크의 rel입니다. 생략하면 target=\"_blank\"일 때 noopener noreferrer입니다.",
}, platform);
set("ListSection", {
  divider: { default:"true", summary:"행 사이 구분선을 그립니다. false면 선 없이 붙여 그립니다. details 섹션의 기본값은 false입니다." },
  density: { default:'"default"', summary:'"compact"는 행 높이를 56에서 44(터치 최소 크기)로 줄이고 위아래 여백을 12로 둡니다. 시작 여백 16은 그대로라 다른 목록과 글자 위치가 맞습니다. details 섹션은 자기 32px 행을 쓰므로 density를 쓰지 않습니다.' },
});
set("DatePicker DateRangePicker", { clearable: { default:"false", summary:"값이 있을 때 달력 아이콘 앞에 지우기 버튼을 보입니다. 누르면 빈 문자열로 바꿉니다. 버튼 이름은 KjunProvider 문구(clearDate)를 따릅니다." } });
set("FormGroup", { optional: { default:"false", summary:"라벨 뒤에 선택 입력 표시를 붙입니다. 문구는 KjunProvider의 locale·messages(optional)를 따르며 required와 함께 주면 required가 우선합니다." } });
set("Switch", { description: { summary:"라벨 아래 보조 설명입니다. 시작 위치는 라벨과 같고, 웹은 aria-describedby, Native는 accessibilityHint로 스위치를 설명합니다." } });
set("Switch", { loading: { default: "false", summary: "저장 중 상태입니다. 손잡이 안에 작은 스피너를 돌리고 누름을 무시하며, disabled와 달리 흐리게 하지 않습니다. 화면 낭독기에는 \"저장 중\"(KjunProvider 문구 saving)을 설명으로 알리고, 웹은 aria-busy, Native는 accessibilityState.busy도 둡니다. 동작 줄이기에서는 스피너가 멈춥니다." } });
for (const platform of ["vue3", "react"]) set("Switch", {
  name: "폼 제출 이름입니다. 켜져 있을 때 formValue를 제출합니다.",
  formValue: { default: '"on"', summary: "켜져 있을 때 폼이 제출할 값입니다." },
}, platform);
set("Switch", {
  id: "스위치 입력의 id입니다. 바깥 <label for>와 연결할 때 씁니다.",
  autoFocus: "처음 그릴 때 스위치에 초점을 둡니다.",
  onFocus: "스위치가 초점을 받을 때 알립니다.",
  onBlur: "스위치가 초점을 잃을 때 알립니다.",
  inputRef: { type: "Ref<HTMLInputElement>", summary: "스위치 입력 요소입니다. 저장이 실패한 뒤 초점을 되돌릴 때 씁니다." },
}, "react");
set("Checkbox", {
  id: "체크박스 입력의 id입니다. 바깥 <label for>와 연결할 때 씁니다.",
  inputRef: { type: "Ref<HTMLInputElement>", summary: "체크박스 입력 요소입니다. 검증에 실패한 묶음의 첫 항목으로 초점을 옮길 때 씁니다." },
}, "react");
set("Radio", {
  id: "라디오 입력의 id입니다. 바깥 <label for>와 연결할 때 씁니다.",
  inputRef: { type: "Ref<HTMLInputElement>", summary: "라디오 입력 요소입니다. 코드에서 초점을 옮길 때 씁니다." },
}, "react");
set("Checkbox Radio Switch", { id: "입력 요소의 id입니다. 바깥 <label for>와 연결할 때 씁니다. 초점은 컴포넌트 ref의 focus()로 옮깁니다." }, "vue3");
set("Checkbox Radio", { description: { summary: "라벨 아래 보조 설명입니다. Switch와 같은 구조로 라벨 시작 위치에 맞추고, 컨트롤은 두 줄 묶음의 세로 가운데에 둡니다. 웹은 aria-describedby, Native는 accessibilityHint로 컨트롤을 설명합니다." } });
for (const platform of ["vue3", "react"]) set("Checkbox", {
  name: "폼 제출 이름입니다. 체크된 동안 formValue를 제출합니다.",
  formValue: { default: '"on"', summary: "체크된 동안 폼이 제출할 값입니다." },
}, platform);
set("Radio", { size: { type: '"sm" | "md" | "lg"', default: '"md"', summary: "라디오 크기입니다. Checkbox와 같은 바깥 크기(20·24·28)를 쓰고 점은 8·10·12로 커집니다. RadioGroup 안에서는 그룹의 size를 따르고, 이 값을 주면 그 항목만 바꿉니다." } });
set("RadioGroup", {
  size: { type: '"sm" | "md" | "lg"', default: '"md"', summary: "그룹 안 모든 Radio의 크기입니다. 각 Radio의 size가 우선합니다." },
  disabled: { default: "false", summary: "그룹 안 모든 Radio를 비활성화합니다. 각 option·Radio의 disabled와 함께 쓸 수 있습니다." },
});
for (const platform of ["vue3", "react"]) set("RadioGroup", { name: { default: "자동 생성", summary: "선택한 Radio가 폼에 제출될 이름입니다. 각 Radio는 자기 val을 문자열로 제출합니다." } }, platform);
set("RadioGroup", { name: "웹 폼 제출 이름입니다. Native에는 폼이 없어 쓰이지 않습니다." }, "native");
set("Radio", { name: "웹 폼 제출 이름입니다. Native에는 폼이 없어 쓰이지 않습니다." }, "native");
for (const platform of ["vue3", "react"]) set("Textarea", {
  submitOn: { type: '"mod-enter" | "enter"', default: '"mod-enter"', summary: "보내기 키입니다. mod-enter는 Ctrl/⌘+Enter, enter는 Enter로 보내고 Shift+Enter로 줄을 바꿉니다. 한글처럼 조합 중인 Enter로는 보내지 않습니다. submit을 받으면 보내기 버튼이 없어도 동작합니다." },
}, platform);
set("Textarea", {
  submitOn: { type: '"mod-enter" | "enter"', default: '"mod-enter"', summary: "보내기 키입니다. Native Web에서는 웹과 같이 mod-enter는 Ctrl/⌘+Enter, enter는 Enter로 보내고 Shift+Enter로 줄을 바꿉니다. 기기 키보드는 보조 키를 알려 주지 않으므로 enter일 때만 return 키로 보냅니다. onSubmit이 있으면 보내기 버튼이 없어도 동작합니다." },
  readOnly: "읽기 전용입니다. 이전 이름 readonly도 받지만 KjunInput과 같은 readOnly를 쓰세요.",
}, "native");
set("Input", {
  revealable: { default: "false", summary: "비밀번호 필드 끝에 ‘보기’ 글자 버튼을 둡니다. 누르면 입력값을 글자로 보이고 ‘숨기기’로 바뀝니다. 두 낱말 중 넓은 폭을 유지해 입력 칸 폭이 흔들리지 않습니다. 버튼 이름은 KjunProvider 문구(revealPasswordLabel·concealPasswordLabel)를 따릅니다. 웹은 type=\"password\", Native는 secureTextEntry일 때만 나타납니다." },
  showCount: { default: "false", summary: "필드 끝에 글자 수를 표시합니다. maxLength가 있으면 \"길이/최대\"로 쓰고, 넘치면 위험 색과 오류 상태로 표시합니다. Textarea와 같은 규칙이며 화면 낭독기에는 필드 설명으로 연결하고 한도에 가까우면 남은 글자 수를 알립니다." },
  clearable: "값이 있을 때 지우기 버튼을 표시합니다. 숫자 0도 값으로 봅니다. 비활성·읽기 전용이면 나타나지 않습니다.",
});
set("Input", { maxLength: "입력할 수 있는 최대 글자 수(UTF-16 단위)입니다. Textarea와 같은 이름이며 maxlength 속성으로도 줄 수 있습니다. showCount와 함께 쓰면 \"길이/최대\"로 표시합니다." }, "vue3");
set("SearchInput", {
  loading: { default: "false", summary: "일반 입력 모드에서 결과를 표·목록처럼 다른 곳에 보여줄 때 조회 중임을 표시합니다. 검색 아이콘 자리에 같은 크기의 스피너를 그려 글자 시작 위치가 움직이지 않고, 입력에 aria-busy를 둡니다. 자동 완성 모드는 패널 안에서 따로 표시합니다." },
});
set("Textarea", { submitting: { default: "false", summary: "보내는 중입니다. 보내기 버튼이 돌고, 끝날 때까지 다시 보내지 않습니다. 웹은 필드에 aria-busy를 둡니다." } });
set("Fab", {
  icon: { summary:"아이콘 이름입니다. 크기는 md 24, sm 20으로 고정됩니다." },
  label: { summary:"아이콘 옆에 보이는 글자입니다. 넘기면 같은 높이의 캡슐(확장형)이 되고, 화면 너비를 넘으면 말줄임합니다." },
  collapsed: { default:"false", summary:"label이 있는 FAB을 원형으로 접습니다. 스크롤 중 콘텐츠를 덜 가릴 때 씁니다. 라벨 폭·간격이 줄어드는 전환을 쓰고(동작 줄이기 설정이면 즉시), 접힌 동안에도 label이 버튼 이름입니다. label이 없으면 효과가 없습니다." },
  ariaLabel: { summary:"버튼 이름입니다. label이 없으면 반드시 넘기고(개발 모드에서 빠지면 경고), label이 있으면 생략할 수 있습니다." },
  size: { type:'"sm" | "md"', default:'"md"', summary:"md는 56, sm은 48입니다. 두 크기 모두 label·loading과 모든 상태를 씁니다." },
  loading: { default:"false", summary:"아이콘을 스피너로 바꾸고 누름을 막습니다. 색은 흐려지지 않고, 최소 표시 시간 동안 유지합니다." },
  disabled: { default:"false", summary:"누를 수 없게 합니다. 아래 콘텐츠가 비치지 않도록 불투명한 채로 흐려집니다." },
  safeArea: { default:"true", summary:"KjunProvider의 하단 안전 영역을 반영합니다." },
  avoidBottomBar: { default:"true", summary:"화면의 KjunBottomNavigation·KjunBottomActionBar 높이만큼 자동으로 위에 놓입니다. 바가 FAB 아래에 있지 않은 배치(Native에서 FAB의 부모가 탭바 위에서 끝나는 경우 등)에서는 false로 끕니다." },
  offsetBottom: { default:"0", summary:"추가로 띄울 거리(px)입니다. KJUN 하단 바 높이는 자동으로 반영되므로 직접 만든 바가 있을 때만 넘깁니다." },
});
set("Fab", { onClick: { summary:"버튼을 누를 때 호출합니다. Vue는 click 이벤트입니다." } }, "react");
set("Fab", { onPress: { summary:"버튼을 누를 때 호출합니다." } }, "native");
set("ExternalLink", {
  label: "아이콘 링크(mode=\"icon\")의 이름이며 기본값은 \"외부 링크\"입니다. 텍스트 링크는 보이는 글자가 이름이므로 label은 children이 없을 때 보이는 글자로만 씁니다.",
});
set("ExternalLink", { onClick: { summary:"링크를 열 때 호출합니다(분석 기록 등). 클릭은 부모로 전달되지 않습니다. 다른 a 속성(id·className·data-*)은 링크에 전달하며 href·target·rel은 KJUN이 정합니다." } }, "react");
set("ExternalLink", { onPress: { summary:"링크를 누를 때 openUrl보다 먼저 호출합니다(분석 기록 등)." } }, "native");
set("Card", {
  pressable: { default: "false", summary: "카드 전체를 하나의 버튼으로 만듭니다. true일 때만 역할·키보드 포커스·Enter/Space·누름 상태가 생기며, 안에는 버튼·링크 같은 누르는 요소를 넣지 마세요(웹 개발 모드 경고)." },
  disabled: { default: "false", summary: "pressable 카드의 누름을 막고 흐리게 표시합니다. pressable이 아니면 의미가 없습니다." },
  ariaLabel: "pressable 카드의 접근성 이름입니다. 생략하면 title을 사용합니다.",
  headingLevel: { default: "3", summary: "제목의 문서 제목 수준입니다(h2–h6, Native는 header 역할). false는 일반 문단입니다. pressable 카드는 카드 전체가 버튼이라 제목을 제목 요소로 그리지 않습니다." },
  mediaPosition: { default: "top", summary: "미디어 위치입니다. top은 헤더 위, start는 내용 옆 96px 고정 열(썸네일)이며 시작 쪽 모서리만 둥글게 자릅니다. 웹은 넣은 요소를 열 높이에 맞춰 채우고, Native는 넣은 요소가 flex 1이나 100% 크기로 틀을 채우게 합니다." },
  mediaAspect: { summary: "미디어 틀의 비율입니다. wide 16:9·standard 4:3·square 1:1이며, 웹은 이미지·영상을 틀에 맞춰 잘라 채웁니다. 생략하면 넣은 요소의 높이를 따릅니다(start 열은 카드 높이)." },
  footerAlign: { default: "start", summary: "푸터 내용의 정렬입니다. end는 확인·취소처럼 오른쪽 끝에 두는 행동에 씁니다(8px 간격, 넘치면 줄바꿈). 카드 안 행동은 secondary 버튼을 기본으로 권장합니다." },
});
set("Card", { onPress: "pressable 카드를 누를 때 호출합니다. 비활성 카드에서는 호출하지 않습니다." }, "native");
set("Card", {
  href: "카드 전체를 하나의 링크(a 요소)로 만듭니다. 다른 페이지로 가는 카드에 씁니다. pressable처럼 hover 상승·누름·초점 링이 생기고, 제목이 있고 headerActions가 없으면 헤더 끝에 20px 오른쪽 화살표(text-tertiary, hover에서 text-secondary)를 그려 링크임을 보여 줍니다. 안에 버튼·링크를 넣지 마세요. 라우터를 쓰면 클릭 처리에서 기본 이동을 막고 라우터로 이동하세요.",
  target: "링크 카드를 열 대상입니다(예: _blank). _blank면 rel을 주지 않을 때 noopener noreferrer를 붙입니다.",
  rel: "링크 카드의 rel입니다. 생략하면 target이 _blank일 때 noopener noreferrer입니다.",
});
set("Card", {
  disabled: { default: "false", summary: "pressable·링크 카드의 누름을 막고 흐리게 표시합니다. 링크 카드는 주소 없이 link 역할만 남습니다." },
  ariaLabel: "pressable·링크 카드의 접근성 이름입니다. 생략하면 title을 사용합니다.",
});
set("Card", {
  href: "카드 전체를 하나의 링크로 만듭니다. Native Web에서는 a 요소로 그리고, 기기에서는 주소로 이동하지 않으므로 onPress에서 앱 라우터로 이동하세요(개발 모드 경고).",
  target: "Native Web에서 링크 카드를 열 대상입니다(예: _blank).",
  rel: "Native Web 링크 카드의 rel입니다. 생략하면 target이 _blank일 때 noopener noreferrer입니다.",
  testID: "카드 바깥 View의 testID입니다.",
  nativeID: "카드 바깥 View의 nativeID입니다(웹에서는 요소 id). aria-labelledby 등에 씁니다.",
}, "native");
set("Accordion", {
  value: { type: "string[]", summary: "열린 항목을 앱이 제어합니다(각 항목의 value로 지정, Vue v-model). 하나만 펼침이면 마지막 값만 엽니다. 제어하면 항목의 defaultOpen은 적용하지 않습니다." },
  defaultValue: { type: "string[]", summary: "value 없이 처음 열어 둘 항목들의 value입니다." },
  onValueChange: "제어할 때는 헤더를 누르면 바뀔 값을 요청하고, 제어하지 않을 때는 열린 항목이 바뀔 때마다 알립니다. value가 없는 항목은 내부 id로 들어갑니다.",
});
set("Accordion", { className: "바깥 요소의 class입니다.", style: "바깥 요소의 style입니다.", id: "바깥 요소의 id입니다." }, "react");
set("Accordion", {
  headingLevel: { type: "2 | 3 | 4 | 5 | 6 | false", default: "3", summary: "Native Web에서 각 헤더를 감쌀 제목 수준(aria-level)입니다. 기기에서는 헤더가 하나의 버튼이라 제목 역할을 함께 줄 수 없습니다." },
  region: { default: "true", summary: "Native Web에서 펼친 본문을 헤더 이름의 영역(region)으로 알립니다. 항목이 많으면 false로 끄세요." },
  style: "바깥 View의 style입니다.",
  testID: "바깥 View의 testID입니다.",
}, "native");
set("AccordionItem", {
  value: "Accordion의 value·defaultValue·onValueChange에서 이 항목을 가리키는 이름입니다.",
  trailing: "헤더 끝, 셰브론 앞에 두는 정보입니다(상태 배지·금액·건수). 행 세로 가운데에 보조 글자색 label로 그리고 최대 폭은 35%입니다. 헤더 버튼의 일부이므로 버튼·링크는 넣지 말고, 글자는 헤더 이름에 함께 읽힙니다(Vue는 trailing 슬롯).",
});
set("AccordionItem", { className: "항목 바깥 요소의 class입니다.", style: "항목 바깥 요소의 style입니다.", id: "항목 바깥 요소의 id입니다." }, "react");
set("AccordionItem", { style: "항목 바깥 View의 style입니다.", testID: "항목 바깥 View의 testID입니다." }, "native");

set("Progress", {
  shape: { default: "bar", summary: "bar는 막대, circle은 원형입니다. 원형 지름·선 굵기는 progress.circle 토큰(sm 24·md 48·lg 64)이고, label·subLabel은 원 아래 가운데에 둡니다. showLabel 퍼센트는 md 이상에서 원 가운데에만 표시합니다." },
});
// 0.15.0 additions.
set("Drawer", { renderScrollView: { type: "(props: ScrollViewProps) => ReactNode", summary: "본문의 스크롤 영역을 앱이 만든 것으로 바꿉니다. 보이는 행만 그리는 FlatList나, ref와 스크롤 이벤트가 필요한 ScrollView에 씁니다. 드로어가 자기 스크롤에 주던 속성(본문 크기와 여백, 키보드 처리, children)을 받으므로 그대로 펼쳐 넣으세요. 머리말·바닥글·크기·안전 영역은 드로어가 그대로 맡습니다." } }, "native");
for (const platform of ["react", "native"]) set("AccordionItem", {
  onAfterOpen: "펼침 애니메이션이 끝나 패널이 제 높이를 갖춘 뒤 한 번 호출합니다. 패널 안의 결과로 스크롤을 맞출 때 씁니다. 처음 그릴 때와, 끝나기 전에 다시 접은 경우에는 호출하지 않습니다.",
  onAfterClose: "접힘 애니메이션이 끝난 뒤 한 번 호출합니다.",
}, platform);
set("Drawer Modal", { onAfterClose: "닫힘 애니메이션이 끝나 화면에서 완전히 사라진 뒤 한 번 호출합니다. 다음 시트·완료 안내를 여기서 띄우세요. 처음부터 닫힌 채 마운트되거나 닫히는 도중 다시 열리면 호출하지 않습니다. 모션 줄이기에서는 닫힌 즉시 호출합니다." }, "react");
set("Drawer Modal", { onAfterClose: "닫힘 애니메이션이 끝난 뒤 한 번 호출합니다. iOS는 시스템 창이 실제로 닫힐 때(onDismiss)까지 기다리므로 여기서 다음 Modal을 띄워도 됩니다. 기기에서는 아직 확인하지 않았습니다." }, "native");
set("Select Combobox Dropdown MenuButton", { returnFocus: "메뉴가 항목 선택이나 Escape로 닫힐 때 트리거 대신 초점을 옮길 요소입니다(요소, ref, 또는 요소를 돌려주는 함수. 닫히는 순간에 읽습니다). 바깥을 눌러 다른 요소로 초점이 간 경우에는 옮기지 않습니다. 웹 전용입니다." });
set("Combobox", { returnFocus: "옵션을 고르거나 Escape로 닫을 때 초점을 옮길 요소입니다. 입력 중 목록이 닫히거나 입력에서 벗어날 때는 입력에 그대로 둡니다. 웹 전용입니다." });
set("Accordion", {
  tone: { default: '"muted"', summary: "그룹의 면입니다. muted(기본)는 보조 면으로 채워 본문과 나누고 테두리를 쓰지 않습니다. card는 카드 색 위에 둘 때 씁니다." },
  divider: { default: "true", summary: "항목 사이에 구분선을 텍스트 시작선부터 긋습니다(아이콘이 있으면 제목 시작선). 마지막 항목 뒤에는 긋지 않습니다. ListSection의 divider와 같은 선이며, false면 선 없이 높이로만 나눕니다." },
  separated: { default: "false", summary: "항목마다 따로 둥근 면으로 나누고 사이를 8px 띄웁니다. 면 색은 tone을 따르며(기본 muted), divider는 적용되지 않습니다." },
});
set("AccordionItem", {
  description: "제목 아래 보조 설명 한 줄입니다(caption, 보조 글자색).",
  icon: { summary: "앞쪽 40px 열에 그릴 아이콘 이름입니다(ListRow와 같은 20px 보조색). 본문과 구분선이 제목 시작선부터 시작합니다." },
});
set("AccordionItem", {
  open: "열림 상태를 앱이 제어합니다(Vue v-model:open). 넘기면 항목은 이 값만 따르고 Accordion의 하나만 펼침 규칙에 참여하지 않습니다.",
  onOpenChange: "제어 항목에서는 제목을 누를 때 변경을 요청하고, 제어하지 않는 항목에서는 열림 상태가 실제로 바뀔 때(형제가 열려 닫힌 경우 포함) 알립니다.",
  keepMounted: { default: "false", summary: "처음 연 뒤로는 접혀도 본문을 지우지 않고 숨깁니다. 안의 입력값·스크롤이 남고, 닫힌 동안에는 Tab과 화면 낭독기에서 빠집니다." },
});
set("Text", {
  id: "React Native의 id입니다. 나머지 RN Text 속성(accessibilityLabel, testID, selectable, allowFontScaling, adjustsFontSizeToFit 등)도 그대로 전달합니다. adjustsFontSizeToFit은 글자 역할 크기를 최대값으로 두고 줄이기만 합니다.",
  onPress: "글자를 누를 때 호출합니다(RN Text onPress). 행동이 주 목적이면 KjunButton variant=\"link\"를 쓰세요.",
  disabled: "RN Text의 disabled입니다. onPress를 막습니다.",
}, "native");
// 0.16.0 additions.
set("Tooltip", {
  title: "본문 위에 굵게 보이는 제목입니다(파일 이름 위의 경로 등). 화면 낭독기는 제목과 본문을 함께 읽습니다. 제목만 있어도 툴팁이 열리고, 제목과 본문이 모두 없으면 열리지 않습니다.",
  align: "글자 정렬입니다. start 또는 center를 고르며, 생략하면 이전과 같습니다.",
  width: "최대 폭 단계입니다(tooltip.maxWidths: sm 192·md 256·lg 320). 생략하면 md(이전 폭)이고, 긴 경로는 폭 안에서 줄바꿈합니다.",
  delay: { default: "0", summary: "마우스를 올린 뒤 열리기까지의 지연 시간(ms)입니다. 툴팁 하나가 열린 뒤에는 다음 툴팁이 지연 없이 열리고, 모두 닫힌 채 0.5초가 지나면 다시 지연을 기다립니다. 키보드 포커스는 바로 열고, 터치 탭으로는 열지 않습니다(Native 기기는 길게 누르기)." },
});
set("Popover", { footer: { summary:"본문 아래 고정 바닥글입니다. 적용·초기화 같은 동작 버튼(KjunFormActions 등)을 두며, 본문만 스크롤하고 아래에 더 있으면 본문 끝이 흐려집니다. 구분선은 그리지 않습니다. 함수로 넘기면 close를 받습니다. Vue는 footer 슬롯을 씁니다." } });
set("Popover", { anchorRect: "트리거 대신 붙을 화면(viewport) 사각형 { x, y, width?, height? }입니다. 값이 바뀌면 위치를 다시 잡고, 함수로 넘기면 열려 있는 동안 매 프레임 읽으며 null이면 마지막 위치를 유지합니다. 이때 트리거는 선택이며, 트리거 안의 누름·초점 이동은 비모달 Popover를 닫지 않습니다(편집기를 트리거로 두면 커서 위치 팝오버가 됩니다). 트리거가 없으면 닫힌 뒤 초점은 열 때 있던 요소로 돌아갑니다. 웹 전용입니다." });
set("BottomNavigation", {
  iconStyle: { default: '"auto"', summary: "아이콘을 그리는 방식입니다. auto는 미선택을 외곽선, 현재 목적지를 채운 아이콘으로 그려 색과 모양으로 구분합니다. filled는 모두 채움형(색으로만 구분, 면적이 비슷한 아이콘 세트에 권장), outline은 모두 외곽선(현재 목적지만 획 2px)입니다. 채움형이 없는 아이콘은 외곽선으로 남습니다." },
  showLabels: { default: "true", summary: "아이콘 아래에 라벨을 보입니다. false면 아이콘만 56px 높이로 그리고 label은 접근성 이름으로 남습니다. 아이콘이 없는 글자 전용 바는 항상 라벨을 보입니다." },
  surface: { default: "true", summary: "표면색 바탕을 그립니다. 각진 바에 위쪽으로 옅은 그림자를 던져 위의 콘텐츠와 구분합니다. false면 바탕·그림자 없이 부모 배경이 그대로 보입니다." },
});
set("BottomActionBar", { variant: { default: '"docked"', summary: "floating이면 화면 가장자리에서 떨어진 알약 모양 바가 됩니다. KjunFloatingNavigation과 같은 띄움·여백·테두리·그림자를 씁니다. 설명과 작업은 항상 한 줄에 놓이고 긴 설명은 말줄임합니다. 안의 버튼은 size를 주지 않으면 lg, 모양은 알약이 됩니다. 설명이 없으면 글자가 있는 버튼들이 폭을 나눠 채웁니다. 바는 화면 맨 아래 자리를 그대로 차지하고 둘레만 투명하므로, 내용 위에 겹쳐 띄우려면 앱이 배치합니다." } });
set("Text", {
  ref: "글자 요소의 ref입니다. 화면 전환 뒤 제목으로 포커스를 옮길 때 씁니다(tabIndex={-1}와 함께).",
  tabIndex: "포커스 순서입니다. -1이면 Tab으로는 닿지 않고 코드로만 포커스를 줄 수 있습니다.",
  role: "요소의 접근성 역할입니다. 상태 문구라면 status처럼 내용의 뜻에 맞는 역할을 줍니다.",
}, "react");
set("Tiles", { ref: "목록 루트(div)의 ref입니다. 다른 div 속성(data-*·aria-*·이벤트)도 루트에 그대로 전달됩니다." }, "react");
set("Pressable", {
  pressEffect: { default: '"overlay"', summary: "눌림 표시 방식입니다. overlay는 마우스를 올리거나 누를 때 내용 위에 글자색 막을 덮어(0.08, 0.16) 사진과 글 위 어디서나 보입니다. none은 막을 그리지 않으며, 내용이 스스로 눌림을 그릴 때만 씁니다." },
  focusRingInset: { default: "false", summary: "키보드 포커스 링을 영역 안쪽에 그립니다. 화면 끝까지 닿는 영역이나 넘침을 자르는 부모 안에서 바깥 링이 잘릴 때 씁니다." },
  ariaLabel: "화면 낭독기가 읽는 이름입니다. 내용에 글자가 없으면(지도, 사진) 반드시 줍니다.",
  disabled: { default: "false", summary: "누름을 막고 내용을 흐리게 표시합니다. 화면 낭독기에는 비활성으로 알립니다." },
});
set("SideNavigation", {
  expanded: { summary: "열린 부모 항목의 key 목록입니다. 생략하면 컴포넌트가 스스로 기억하며, 현재 목적지의 부모를 연 채로 시작합니다. 주면 앱이 관리합니다(Vue v-model:expanded). 닫힌 부모 아래 페이지로 이동하면 그 부모를 더한 목록으로 알립니다." },
  collapsed: { default: "false", summary: "아이콘만 표시합니다. 항목은 아이콘을 감싸는 44×40px 면이 되고 열 폭은 앱이 줄입니다(44px + 앱의 좌우 여백). 이름은 툴팁과 화면 낭독기로 전합니다. 하위 항목은 숨기며, 부모를 누르면 넓혀 달라고 요청하거나(Vue v-model:collapsed) collapsedParent=\"flyout\"이면 옆 패널로 보여 줍니다. 현재 페이지를 품은 부모는 선택 배경의 절반 세기 면으로 표시합니다. 다시 넓어질 때 이름·제목·배지는 열이 펼쳐진 뒤 서서히 나타납니다." },
});
set("SideNavigation", {
  collapsibleGroups: { default: "false", summary: "묶음 제목을 여닫는 32px 행으로 바꿉니다(터치 포인터에서는 44px). 행 끝의 작은 14px 꺾쇠가 부모 항목처럼 열리면 뒤집힙니다. 현재 페이지가 있는 묶음과 defaultOpen 묶음은 열린 채로 시작하고, 닫힌 묶음 안으로 이동하면 열립니다. 닫힌 묶음은 안에 현재 페이지가 있으면 제목을 본문 글자색으로, 배지가 있으면 끝에 점을 표시합니다. 묶음마다 collapsible을 주면 이 값보다 우선합니다(false면 늘 펼친 제목)." },
  groupCounts: { default: "false", summary: "여닫는 묶음 제목의 꺾쇠 앞에 그 안의 행 수를 3차 글자색 숫자로 표시합니다. 열림·닫힘과 상관없이 같은 자리에 있어 여닫을 때 깜빡이지 않습니다. 닫힌 묶음 안에 배지가 있으면 숫자 대신 점을 표시합니다." },
  headingLevel: { default: "2", summary: "묶음 제목의 제목 요소 단계입니다(2–6). 화면 낭독기의 제목 이동에 쓰이므로 페이지 개요에 맞춥니다. Native에서는 Native Web의 aria-level입니다." },
  showAll: { summary: "limit을 넘는 행을 모두 보여 주는 묶음의 key 목록입니다. 생략하면 컴포넌트가 스스로 기억하고, 주면 앱이 관리합니다(Vue v-model:showAll). 묶음의 limit을 넘으면 처음 행 뒤에 \"N개 더 보기\" 행이 놓이며, 현재 페이지 행은 limit 밖이어도 보입니다." },
  value: { type: "string | null", summary: "현재 목적지의 key입니다(부모 아래 페이지면 하위 항목의 key). 메뉴에 없는 페이지에서는 null을 줍니다." },
  collapsedParent: { default: '"widen"', summary: "collapsed에서 부모 항목이나 rail=\"groups\"의 묶음을 눌렀을 때의 동작입니다. widen은 그 부모나 묶음을 연 채로 넓혀 달라고 요청합니다(onCollapsedChange). flyout은 열 폭을 그대로 두고 아이콘 옆에 제목과 하위 항목을 담은 비모달 패널을 띄웁니다. → 키로 열고 Esc나 바깥 누름으로 닫으며, 목적지를 누르면 닫힙니다." },
  collapseToggle: { default: "false", summary: "푸터 끝에 사이드바를 접고 펴는 버튼을 둡니다. 누르면 onCollapsedChange(Vue update:collapsed)를 반대 값으로 호출하고, 이름은 메뉴 접기·메뉴 펼치기입니다. 접힌 상태에서는 아이콘 행과 같은 44×40px 면이 되어 푸터 내용 위에 놓입니다." },
  expandedGroups: { summary: "열린 묶음 목록입니다. 묶음의 key, 없으면 제목으로 구분합니다. 생략하면 컴포넌트가 스스로 기억하고, 주면 앱이 관리합니다(Vue v-model:expandedGroups). 열린 상태를 저장하거나 메뉴 검색 중 모든 묶음을 열 때 씁니다." },
  rail: { default: '"items"', summary: "collapsed일 때 아이콘을 세우는 단위입니다. items는 최상위 항목마다, groups는 묶음마다 아이콘 하나를 세웁니다(묶음의 icon, 없으면 제목의 첫 글자). groups에서 묶음을 누르면 그 묶음을 연 채로 넓혀 달라고 요청하고, 웹에서는 넓어진 뒤 묶음 제목을 화면 안으로 스크롤합니다. 묶음 밖 항목은 그대로 한 줄씩 남습니다." },
  railLabels: { default: "false", summary: "collapsed일 때 아이콘 아래에 짧은 이름을 한 줄로 보여 줍니다. 항목은 72px 폭이 되고(열 폭은 72px + 앱의 좌우 여백), 현재 목적지·마우스 올림·누름은 아이콘을 감싸는 56×32px 면으로 표시합니다. 이름이 보이므로 툴팁은 띄우지 않고, 배지는 숫자 그대로 아이콘 모서리에 놓입니다. 이름 칸은 72px(한글 약 4자)이므로 긴 이름에는 목적지·부모의 shortLabel, 묶음의 shortTitle을 주세요. 전체 이름은 접근 가능한 이름과 툴팁으로 남고, 넘치면 말줄임합니다." },
  density: { default: '"default"', summary: "compact이면 마우스 포인터에서 항목을 32px, 하위 항목을 30px로 줄이고, 항목 끝의 숫자 배지를 3차 글자색 숫자로 낮춥니다(점 배지는 그대로). 문서·설정처럼 항목이 많은 목록에 씁니다. 터치 포인터와 Native 기기에서는 터치 높이(48·44px)를 유지합니다." },
});
set("SideNavigation", {
  header: { summary: "목록 위에 둘 내용입니다(로고, 워크스페이스 전환, 검색). collapsed를 받는 함수로 주면 접힌 상태에서 아이콘만 남길 수 있습니다. header나 footer가 있으면 목록만 스크롤되고 둘은 제자리에 남습니다." },
  footer: { summary: "목록 아래에 둘 내용입니다(계정, 도움말). collapsed를 받는 함수로 줄 수 있습니다. 접힌 상태에서는 아이콘 행 폭에 맞춰 가운데 정렬합니다." },
  onAction: { summary: "행 끝 동작 버튼(목적지의 actions)이나 묶음 제목 끝 동작 버튼(묶음의 action)을 누르면 행 또는 묶음의 key, 동작의 key, 이벤트로 호출합니다. 버튼은 링크 바깥에 놓여 목적지로 이동하지 않습니다." },
}, "react");
set("SideNavigation", {
  header: { summary: "목록 위에 둘 내용입니다. collapsed를 받는 함수로 주면 접힌 상태에서 바꿔 그릴 수 있습니다. Native는 스스로 스크롤하지 않으므로 앱의 ScrollView 안에 둡니다." },
  footer: { summary: "목록 아래에 둘 내용입니다. collapsed를 받는 함수로 줄 수 있습니다." },
  onAction: { summary: "행 끝이나 묶음 제목 끝의 동작 버튼을 누르면 행 또는 묶음의 key, 동작의 key, 이벤트로 호출합니다. 기기에서는 버튼이 항상 보입니다." },
}, "native");
for (const platform of ["react", "vue3"]) set("SideNavigation", {
  linkAs: { summary: platform === "vue3" ? "켜진 링크를 앱 라우터의 링크 컴포넌트(RouterLink 등)로 그립니다. 주소는 linkProp 이름으로 넘기고 class·aria-*·data-*·클릭 처리는 속성으로 넘기므로, 그 컴포넌트는 받은 속성을 <a>에 그대로 붙여야 합니다. 비활성 목적지는 늘 <a>입니다." : "켜진 링크를 앱 라우터의 링크 컴포넌트(Next.js Link, React Router Link)로 그립니다. href·className·aria-*·data-*·onClick·children을 넘기므로 그 컴포넌트는 받은 속성을 <a>에 그대로 붙여야 합니다. 프리페치 같은 라우터 기능을 그대로 쓸 수 있습니다. 비활성 목적지는 늘 <a>입니다." },
  scrollToCurrent: { default: "true", summary: "처음 그릴 때와 현재 페이지가 바뀔 때 현재 행(가려졌다면 그 행을 품은 부모나 묶음)을 메뉴가 들어 있는 스크롤 영역 안으로 가장 짧게 옮깁니다. 창 전체는 스크롤하지 않습니다." },
}, platform);
set("SideNavigation", { linkProp: { default: '"href"', summary: "linkAs 컴포넌트에 주소를 넘길 prop 이름입니다. Vue Router의 RouterLink는 to를 씁니다." } }, "vue3");
for (const platform of ["react", "native"]) set("SideNavigation", {
  onShowAllChange: "\"N개 더 보기\"나 \"접기\" 행을 누르면 다음 key 목록으로 호출합니다. showAll을 주었다면 받은 값을 반영합니다.",
  onExpandedGroupsChange: "묶음을 여닫거나, 닫힌 묶음 안으로 이동했거나, rail=\"groups\"에서 묶음을 눌렀을 때 다음 목록으로 호출합니다. expandedGroups를 주었다면 받은 값을 반영합니다.",
  onReselect: "현재 목적지를 다시 눌렀을 때 호출합니다(onNavigate 다음). 목록을 맨 위로 올리거나 새로 고칠 때 씁니다.",
  onExpandedChange: "부모 항목을 여닫거나 닫힌 부모 아래 페이지로 이동했을 때 다음 key 목록으로 호출합니다. expanded를 주었다면 받은 값을 반영합니다.",
  onCollapsedChange: "collapsed에서 부모 항목이나 rail=\"groups\"의 묶음을 누르면(collapsedParent=\"widen\") false로, 접기 버튼(collapseToggle)을 누르면 반대 값으로 호출합니다. 받은 값으로 사이드바 폭을 바꾸면 눌렀던 부모나 묶음이 열린 채로 보입니다.",
  onNavigate: platform === "native" ? "목적지를 누르면 key와 이벤트로 호출합니다. Native Web에서는 수정 키 클릭과 target이 있는 링크를 브라우저에 맡기고 호출하지 않습니다." : "수정 키 없는 일반 클릭으로 이 탭의 목적지를 누르면 key와 이벤트로 호출합니다. 기본 이동을 막고 앱에서 이동하세요. 수정 키 클릭과 target이 있는 링크는 브라우저가 엽니다.",
}, platform);

set("SideNavigationLayout", {
  nav: { summary: "열(좁은 화면에서는 서랍)에 놓을 메뉴입니다. 보통 KjunSideNavigation입니다. { collapsed, drawer, closeDrawer }를 받는 함수로 주면 서랍 안에서 펼친 메뉴를 그리고, 메뉴의 onNavigate에서 closeDrawer()로 서랍을 닫을 수 있습니다(Vue nav 슬롯). 열에서는 closeDrawer가 아무 일도 하지 않습니다." },
  railBreakpoint: { default: "0", summary: "화면 폭이 이 값(px)보다 좁아지면 열을 아이콘 열로 줄여 달라고(onCollapsedChange(true), Vue update:collapsed), 다시 넓어지면 펼쳐 달라고 요청합니다. 처음 그릴 때 이미 좁으면 줄여 달라고 요청합니다. 값을 넘나들 때만 요청하므로 그 사이에는 메뉴의 접기 버튼이 정한 상태가 유지됩니다. breakpoint보다 큰 값을 주세요. 0이면 쓰지 않습니다." },
  collapsed: { default: "false", summary: "열을 아이콘 열로 줄입니다(68px, railLabels이면 80px). 메뉴에도 같은 값을 넘기세요. 폭은 collapse 모션(200ms)으로 바뀝니다." },
  railLabels: { default: "false", summary: "메뉴가 접힌 상태에서 아이콘 아래 이름을 보여 줄 때(KjunSideNavigation railLabels) 켜면 접힌 열이 80px이 됩니다." },
  width: { default: '"md"', summary: "열린 열의 폭입니다. sm 224px, md 256px, lg 288px입니다. 열 안쪽에 좌우·위아래 12px 여백을 둡니다." },
  breakpoint: { default: "768", summary: "화면 폭이 이 값(px)보다 좁으면 열을 없애고 메뉴를 시작 쪽 서랍에서 엽니다. 0이면 늘 열을 둡니다. 기본값은 tokens.responsive.sideNavigationLayout입니다." },
  navOpen: { default: "false", summary: "좁은 화면에서 메뉴 서랍이 열렸는지입니다. 앱의 메뉴 버튼으로 열고, 메뉴의 onNavigate에서 nav의 closeDrawer()로 닫으세요(Vue v-model:navOpen). 서랍이 열린 채 화면이 breakpoint보다 넓어지면 서랍을 닫아 달라고(false) 요청하므로, 다시 좁아져도 서랍이 저절로 열리지 않습니다." },
  drawerLabel: { summary: "서랍의 접근 가능한 이름입니다. 생략하면 메뉴의 기본 이름(주요 탐색)입니다." },
});
for (const platform of ["react", "vue3"]) set("SideNavigationLayout", {
  sticky: { default: "true", summary: "열을 화면 높이로 고정해 페이지와 따로 스크롤합니다. false면 열이 페이지와 함께 스크롤됩니다." },
  stickyOffset: { default: "0", summary: "고정된 열을 화면 위에서 이만큼(px) 내려 둡니다. 위에 고정된 상단 바가 있으면 그 높이를 주세요. 열의 높이는 화면 높이에서 이 값을 뺀 만큼이라 아래가 잘리지 않습니다." },
}, platform);
for (const platform of ["react", "native"]) set("SideNavigationLayout", {
  onNavOpenChange: "서랍을 닫으려 할 때(바깥 누름, Esc, 닫기 버튼, nav의 closeDrawer, 서랍이 열린 채 화면이 breakpoint보다 넓어질 때) false로 호출합니다. 받은 값을 navOpen에 반영하세요.",
  onCollapsedChange: "railBreakpoint를 넘나들 때 줄일지(true) 펼칠지(false)를 알립니다. 받은 값을 collapsed와 메뉴의 collapsed에 함께 반영하세요.",
  children: "메뉴 옆에 놓을 페이지 내용입니다.",
}, platform);
set("SideNavigationLayout", { style: "레이아웃 바깥 View의 스타일입니다. 레이아웃은 받은 자리를 채우므로 높이·배경은 앱이 정합니다." }, "native");
set("Drawer", {
  ariaLabel: "패널의 접근성 이름입니다. 생략하면 제목이나 header 영역을 이름으로 연결하고, 둘 다 없으면 \"패널\"로 읽습니다.",
  ariaDescribedBy: "패널을 설명하는 요소 id입니다. 이름 다음에 읽습니다. Native는 React Native Web에서만 연결합니다.",
  returnFocus: "닫힘 애니메이션이 끝난 뒤 초점을 보낼 요소입니다. 요소·ref·요소를 돌려주는 함수를 받으며 닫힐 때 최신 값을 읽습니다. 대상이 없거나 제거되면 원래 열기 버튼, 남아 있는 상위 창 순서로 복귀합니다. React·Vue 웹 전용입니다.",
  headerActions: "제목 줄의 보조 행동(초기화·편집 등)입니다. 닫기 버튼 앞에 4px 간격으로 놓이고 제목은 남은 폭에서 줄바꿈합니다. Vue는 headerActions 슬롯입니다.",
  handle: { default: "false", summary: "아래 Drawer 위쪽에 36×4px 손잡이를 둡니다. 손잡이나 헤더를 아래로 끌면 패널이 따라 내려오고, 64px 넘게 끌거나 빠르게 내리면 닫힙니다. 그보다 적게 끌면 제자리로 돌아갑니다. 닫기 버튼·Esc·뒤 화면 누르기는 그대로입니다. position이 bottom일 때만 그립니다." },
});
