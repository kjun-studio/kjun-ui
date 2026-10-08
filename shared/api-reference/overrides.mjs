// Explicit component/prop bindings: sharing a name alone does not imply the same contract.
export const overrides = {};
const set = (names, props, platform = "common") => {
  for (const name of names.split(" ")) {
    const entry = (overrides["Ds" + name] ||= {});
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
set("Input Textarea Select Combobox DatePicker SearchInput", {
  error: "필드를 오류 상태로 표시합니다. 오류 설명과 검증 결과는 소비자가 별도로 제공합니다.",
});
set("Alert", {
  variant: "info·success·warning·danger·primary 표현입니다. primary는 프로젝트의 brandSubtleBg·brandLight(생략 시 border)·brand 역할을 사용하며 type보다 우선합니다.",
  size: "sm은 조밀한 12px/16px 본문, md는 제목 유무와 관계없이 14px/20px 본문을 사용합니다. lg는 호환성을 위해 md와 동일합니다.",
  closable: "닫기 버튼을 표시합니다. sm은 24px, md는 28px이며 ✕가 본문 여백 끝에 맞춰집니다. 실행하면 내부 알림을 숨기고 닫힘을 한 번 통지합니다.",
  actions: "본문 아래 행동 영역입니다. size를 생략한 DsButton은 sm 알림에서 xs, md 알림에서 sm 크기를 사용하고, secondary는 surface 배경을 사용합니다. 직접 지정한 size가 우선합니다.",
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
set("DropdownItem", { selected: "메뉴 항목의 현재 선택 여부를 표시합니다." });
set("MenuButton", {
  size: { default: "md", summary: "Button과 같은 높이·모서리·아이콘 크기를 사용합니다. 기본 md는 40px이며 좁은 도구 모음에는 sm을 명시하세요." },
  variant: { default: "secondary", summary: "세 플랫폼 모두 secondary가 기본입니다. 열린 동안 해당 변형의 active 색상 역할을 유지합니다." },
  compact: "true이면 정사각형 dots-vertical 버튼을 표시합니다. label은 화면에서 숨기고 접근성 이름으로 유지합니다.",
  loading: "라벨과 너비를 유지하며 아이콘 위치에 스피너를 표시합니다. 최소 400ms 동안 메뉴 열기를 막고, 열려 있던 메뉴는 닫습니다. disabled가 별도로 true인 경우에만 흐리게 표시합니다.",
});
set("Radio Checkbox", {
  val: "이 항목이 나타내는 값입니다. 현재 그룹 선택값인 value와 구분합니다.",
  value:
    "현재 선택값입니다. Checkbox는 boolean 또는 선택값 배열, Radio는 그룹의 선택값을 사용합니다.",
});
set("Radio", { value: "현재 그룹의 선택값입니다. val과 같으면 이 항목을 선택 상태로 표시합니다." });
set("Switch", { value: "현재 켜짐 여부입니다. 변경 통지 결과를 boolean 값으로 반영합니다." });
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
});
for (const platform of ["react", "native"]) set("Combobox", {
  options: "검색 후보입니다. 같은 선택값·라벨을 가진 옵션 객체를 다시 만들어도 검색 초안을 유지합니다. 선택값이나 선택 라벨이 바뀌면 표시값을 동기화합니다.",
}, platform);
set("Input", {
  onEnter: "조합 중이 아니고 onKeyDown에서 preventDefault로 소비하지 않은 Enter에 한 번 호출합니다. 한글 조합 확정은 제출로 처리하지 않습니다.",
}, "react");
set("ButtonGroup RadioGroup", {
  value: "현재 선택한 옵션의 값입니다. 변경 결과를 소비자 상태에 반영합니다.",
});
set("Tabs", { value: { summary: "활성 탭 이름은 소비자가 소유하며 변경 요청을 value에 반영합니다.", details: [
  { label: "빈 값의 초기 선택", text: "value가 빈 문자열이면 첫 활성 항목의 도착·변경을 감지하여 선택을 요청합니다. items와 복합 TabPane 모두 지원합니다. 같은 빈 값 기간에 같은 후보는 한 번만 요청하며 객체 재생성·부모의 거절로 반복하지 않습니다. 비어 있지 않은 부모 값은 자동 교체하지 않습니다." },
  { label: "통지 순서", text: "초기 선택과 사용자 선택 모두 Vue input → change, React·Native onValueChange → onChange 순서입니다. 부모가 비어 있지 않은 값을 지정한 뒤 다시 빈 값으로 초기화하면 초기 선택을 다시 요청할 수 있습니다." },
] } });
set("TabPane", { disabled: "탭 선택을 비활성화합니다. Vue의 복합 탭 등록 정보도 속성 변경을 따라갑니다." }, "vue2");
set("Pagination", {
  showSizeSelector: "페이지당 항목 수 선택기를 표시합니다. 전체 페이지가 0개나 1개여도 선택기를 유지합니다.",
  showInfo: "전체 행이 있으면 현재 표시 범위와 전체 행 수를 표시합니다. 한 페이지일 때도 유지합니다.",
});
set("DatePicker", {
  value: "현재 선택 날짜 문자열입니다. 웹 날짜 입력의 YYYY-MM-DD 형식을 사용합니다.",
  min: "선택 가능한 최소 날짜입니다.",
  max: "선택 가능한 최대 날짜입니다.",
});
set("AnimatedNumber PriceCell SignedValue Deviation Progress ProgressCell HeatmapCell", {
  value: "표시·계산에 사용할 숫자 값입니다. 입력 편집이나 변경 통지는 제공하지 않습니다.",
});
set("CopyButton", { value: "클립보드에 복사할 문자열입니다." });
set("Modal Drawer Popover", { value: "Vue v-model로 연결할 현재 열림 여부입니다." }, "vue2");
set("Accordion", { multiple: { summary: "여러 항목을 동시에 펼치도록 허용합니다.", details: [
  { label: "동적 변경", text: "false로 전환하면 현재 열린 항목 중 마지막으로 연 항목만 유지합니다. 다시 true로 바꿔도 닫힌 항목을 복원하지 않습니다. 제거된 자식은 열린 상태 목록에서도 정리합니다." },
  { label: "기본 펼침", text: "단일 모드에서 여러 자식이 defaultOpen이면 첫 등록 항목만 엽니다. defaultOpen은 최초 등록용이며 이후 상태 제어 prop이 아닙니다." },
] } });
set("Dropdown", { onClose: { summary: "실제 닫힘 전이에 한 번 호출합니다.", details: [
  { label: "선택 순서", text: "항목 action → onClose 한 번 순서입니다. 같은 이벤트의 중복 닫힘 요청과 퇴장 애니메이션 완료는 추가 통지를 만들지 않습니다." },
] } }, "react");
set("Card", {
  surface: "표면의 배경·전경·테두리 색상 역할을 선택합니다. default/muted는 단색, accent/success/warning/danger/subtle/brand는 두 색의 배경, glass는 반투명 배경입니다. border·elevation은 독립적으로 적용됩니다.",
  padding: "헤더·본문·푸터의 기본 여백입니다. none/sm/md/lg이며 기본값은 md입니다. 화면 폭에 따라 자동 변경되지 않습니다.",
  bodyPadding: { default: "padding 상속", summary: "본문 여백만 바꿉니다. none이면 표나 목록을 카드 가장자리까지 채우면서 헤더·푸터 여백을 유지합니다." },
  radius: "공통 모서리 스케일 none/sm/md/lg를 선택합니다. 기본값은 md이며 미디어 상단 모서리에도 적용됩니다.",
  border: "모든 surface에서 외곽 테두리의 표시 여부를 결정합니다. 기본값 false이며 표면이 이 값을 덮어쓰지 않습니다.",
  dividers: "헤더와 본문, 본문과 푸터 사이의 구분선을 표시합니다. 각 선 양쪽에 해당 영역의 여백을 유지합니다.",
});
set("Card", {
  header: "제목·설명 영역을 교체합니다. headerActions와 함께 사용할 수 있습니다.",
  headerActions: "헤더 오른쪽 행동입니다. 공간이 부족하면 다음 줄로 내려가며 긴 Button 문구는 카드 안에서 줄바꿈합니다. 제목이나 header가 없어도 표시합니다.",
  media: "헤더 위에 표시하는 미디어입니다. 미디어만 있을 때는 아래 모서리까지 카드 반경에 맞춰 자릅니다.",
}, "react");
set("Card", {
  header: "제목·설명 영역을 교체합니다. headerActions와 함께 사용할 수 있습니다.",
  headerActions: "헤더 오른쪽 행동입니다. 공간이 부족하면 다음 줄로 내려가며 긴 Button 문구는 카드 안에서 줄바꿈합니다. 제목이나 header가 없어도 표시합니다.",
  media: "헤더 위에 표시하는 미디어입니다. 미디어만 있을 때는 아래 모서리까지 카드 반경에 맞춰 자릅니다.",
}, "native");
set("Select FilterGroup", { multiple: "복수 선택을 사용합니다. value도 배열 형태로 전달하세요." });
set("Icon", {
  name: "패키지에 포함된 아이콘 이름입니다.",
  size: "아이콘의 표시 크기입니다. 웹 CSS 길이와 Native 숫자 크기를 구분합니다.",
  min: "SVG 기본 요소에 전달되는 min 속성입니다. 아이콘 크기를 제한하지 않습니다.",
  max: "SVG 기본 요소에 전달되는 max 속성입니다. 아이콘 크기를 제한하지 않습니다.",
  type: "SVG 기본 요소에 전달되는 type 속성입니다. 아이콘 종류는 name으로 선택합니다.",
});
set("FormSkeleton", {
  columns: "폼 스켈레톤을 배치할 열 수입니다.",
  size: { default: "md", summary: "대상 Input과 같은 크기입니다. sm 32px, md 40px, lg 48px이며 모서리도 공유합니다." },
  fields: "필드 라벨 또는 { label, height } 배열입니다. 개별 height가 size와 multiline보다 우선합니다.",
  multiline: "개별 높이를 지정하지 않은 필드를 3줄 Textarea와 같은 높이(sm 92px, md 100px, lg 108px)로 표시합니다.",
});
set("Skeleton", { columns: "표 형태 스켈레톤의 열 수입니다." });
set("MarketTableSkeleton", {
  columns: "MarketTable과 동일한 열 구성입니다. 기본 폭은 이름 240px·기타 160px·액션 96px이며 지정한 너비를 우선합니다.",
});
set("ListSkeleton Skeleton MarketTableSkeleton", { rows: "자리 표시자로 출력할 행 수입니다." });
set("Textarea", { rows: "여러 줄 입력의 표시 행 수입니다." });
set("MarketCards MarketSimpleList MarketTable", {
  rows: "현재 표시할 시장 행 객체 배열입니다.",
  pagination: "시장 목록의 페이지 설정 { page, size, total }입니다.",
  sortKey: "현재 정렬 열·지표를 표시하는 키입니다. 실제 정렬 데이터는 소비자가 제공합니다.",
});
delete overrides.DsMarketSimpleList.common.sortKey;
set("Sparkline", { data: "시간 순서대로 연결할 숫자 배열입니다. 데이터 정렬은 소비자가 합니다." });
set("FormActions", {
  loading: "확인 버튼의 라벨 공간과 너비·높이를 유지하고 중앙에 스피너를 표시합니다. 취소 비활성은 cancelDisabled로 별도 제어합니다.",
  variant: "확인 버튼의 강조 스타일입니다.",
  size: "확인·취소 버튼의 최소 높이입니다. sm=32px, md=40px, 기본 lg=48px이며 긴 라벨은 줄바꿈에 따라 높이가 늘어납니다.",
  confirmText: "확인 버튼의 문구입니다. 긴 문구는 영역 안에서 줄바꿈하며 두 버튼이 한 줄에 들어가지 않으면 전체 너비로 세로 배치합니다.",
  cancelText: "취소 버튼의 문구입니다. 좁은 폭에서도 취소 → 확인 순서와 8px 간격을 유지합니다.",
});
set("Alert", { type: "알림의 의미 색상(info·success·warning·danger 등)을 선택합니다." });
set("Input Button", { type: "기본 입력 또는 버튼 요소에 전달할 HTML 동작 유형입니다." }, "react");
set("Input", { type: "웹 입력 요소의 종류입니다." }, "vue2");
set("SearchInput", {
  itemKey:
    "자동 완성 결과의 반복 렌더링 key로 읽을 필드입니다. 모든 플랫폼에서 기본값은 id이며 string·number 식별자를 사용합니다.",
});
set("Modal", {
  ariaLabel: "대화상자의 접근성 이름입니다. 명시하면 시각적 제목보다 우선합니다. 헤더를 숨겨도 이름 또는 title을 유지하며, 둘 다 없으면 '대화상자'를 사용합니다.",
});
set("Dropdown", {
  trigger: "메뉴를 여는 단일 버튼 요소입니다. id·aria-haspopup·aria-expanded·aria-controls와 disabled를 실제 버튼에 전달합니다. 사용자 정의 버튼은 받은 속성을 DOM 버튼에 전달해야 합니다. DsTooltip으로 감싼 버튼도 지원합니다.",
  triggerId: "실제 트리거 버튼의 id입니다. 생략하면 버튼의 기존 id 또는 자동 생성 id를 사용하며 메뉴의 접근성 이름에 연결합니다.",
}, "react");

set("CollectionMark", {
  active: "등록·관심 여부를 표시합니다. 이 컴포넌트는 변경 행동을 제공하지 않습니다.",
});
set("KpiHero", { value: "대표 지표의 현재 값입니다. 계산과 데이터 조회는 소비자가 수행합니다." });
set("SignedValue", {
  isRaw: "percent 형식에서 true면 퍼센트 단위(2.35), false면 비율 단위(0.0235)를 받습니다.",
});
set("PriceCell", {
  flashClass:
    "소비자가 지정한 웹 강조 클래스입니다. 가격 변화를 감지해 자동으로 넣고 빼지 않습니다.",
});
set(
  "DatePicker",
  {
    type: "상속된 HTML 입력 속성입니다. 실제 구현은 date로 고정하므로 이 값으로 종류를 바꿀 수 없습니다.",
  },
  "react",
);
set(
  "ButtonGroup",
  {
    options:
      "단일 선택 옵션 { value, label, icon? }입니다. Vue는 옵션별 disabled를 소비하지 않습니다.",
  },
  "vue2",
);
set(
  "RadioGroup",
  { disabled: "그룹 내 옵션과 슬롯 Radio의 실행을 막습니다. Vue에서만 지원합니다." },
  "vue2",
);
set("Freshness", { formatter: "수집 시각 문자열을 설명에 표시할 문자열로 변환합니다." });
set("Progress", { label: "진행률의 제목입니다. Vue는 showLabel이 켜져야 제목을 표시합니다." });
set("Input", { step: "HTML 숫자 입력의 증가·감소 간격입니다." }, "vue2");
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
set("Card", { dividers: { default:"false", summary:"헤더·본문·푸터 사이 구분선을 표시합니다. 기본은 구분선 없이 16px 간격으로 나눕니다." } });
set("ChartSkeleton", { loadingText: { default:'"차트를 불러오는 중"', summary:"시각적으로 표시할 로딩 문구입니다. 빈 문자열은 문구만 숨깁니다. 스크린 리더 알림은 DataState 등 부모 상태 영역에서 제공합니다." } });
set("Tabs", { density:"comfortable은 44px, compact는 32px 높이입니다. 두 변형 모두 14px 라벨을 사용합니다.", variant:"underline은 2px 선택선, pills는 선택 항목의 중립 배경을 제공합니다." });

set("Card", { elevation: { summary: "콘텐츠 표면의 역할입니다. 기본 flat에는 그림자가 없고 raised에는 옅은 접촉 그림자가 있습니다.", details: [{ label: "행동", text: "Card 자체에는 hover 그림자·상승·pointer 효과가 없습니다. 행동은 내부 Button·Link에 연결합니다." }] } });
set("Card", { border: { default: "false", summary: "카드 안쪽에 0.5px 외곽선을 표시합니다. 기본은 선이 없으며, 테두리를 켜도 콘텐츠의 여백과 전체 크기는 바뀌지 않습니다." } });
