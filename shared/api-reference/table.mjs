import { detail, event, slot, fields } from "./helpers.mjs";
const ownership = [
  "data·selected·페이지 데이터: 소비자가 소유합니다. selected는 행 객체 배열이며 rowKey로 선택을 비교합니다.",
  "정렬: sort를 생략하면 내부 상태, 객체 또는 null을 전달하면 소비자 제어 상태입니다. sortMode=client는 받은 data를 정렬하고 server는 소비자가 전달한 순서를 유지합니다. 검색어는 내부 상태이며 검색 결과는 소비자가 제공합니다.",
  "행 확장: expandedRows를 제공하면 소비자가 제어하고, 생략하면 내부에서 관리합니다. 선택 배열과 달리 행의 키 배열을 사용합니다.",
];
const common = {
  columns: detail("표시 열과 정렬·셀 렌더링을 정의합니다.", {
    "열 연결":
      "key는 행에서 값을 읽을 경로, label은 헤더입니다. sortable은 표와 열에서 모두 허용해야 동작합니다.",
    렌더링:
      "사용자 셀 렌더링은 아래 TableColumn·renderCell 계약을 참고하세요. 객체 데이터의 정렬·필터링 목적과 표시 형식을 구분합니다.",
  }),
  selected: detail("현재 선택된 행 객체 배열입니다.", {
    전달값:
      "selection-change 또는 onSelectionChange는 다음 행 객체 배열 전체를 전달합니다. 키 배열이 아닙니다.",
    "상태 책임":
      "다음 배열을 selected에 반영하세요. 전체 선택은 현재 표시 데이터 범위를 사용합니다. 재조회 후 객체가 달라도 rowKey가 같으면 선택으로 판정합니다.",
  }),
  rowKey: detail("행 선택·확장에 사용할 안정된 식별 필드입니다.", {
    조건: "모든 행에 고유하고 안정된 값을 제공하세요. 누락된 키·중복 키는 선택 구분을 깨뜨릴 수 있습니다.",
    "플랫폼 차이":
      "React·Native의 표시·확장 키 계산에는 인덱스 대체가 있지만 선택 비교는 rowKey 값을 사용합니다. Vue 선택 mixin은 직접 row[rowKey]를 읽으므로 선택 가능한 표는 최상위 필드 키를 사용하세요.",
  }),
  sortable: detail("정렬 기능을 활성화합니다.", {
    전이: "같은 열을 누르면 오름차순 → 내림차순 → 정렬 없음으로 순환합니다. 정렬 해제 시 key는 빈 문자열입니다.",
    "상태 책임":
      "false이면 헤더 조작과 정렬 표시를 끄고 data의 순서를 그대로 유지하며 변경을 통지하지 않습니다. 서버 정렬은 sortable=true와 sortMode=server를 함께 사용하세요.",
  }),
  sort: { type: "TableSort | null", default: "undefined", ...detail("표시할 정렬 키와 방향을 외부에서 제어합니다.", {
    "제어 방식": "undefined이면 내부 상태입니다. { key, order } 또는 null이면 완전한 제어 상태이며 변경 통지만으로 표시가 바뀌지 않습니다. null과 빈 key는 정렬 없음입니다.",
    "상태 연결": "React·Native는 onSortChange의 값을 sort에 반영합니다. Vue는 :sort.sync 또는 update:sort를 사용합니다. 외부 필터 초기화 시 sort=null로 정렬 표시도 초기화할 수 있습니다.",
  }) },
  sortMode: { default: '"client"', ...detail("정렬을 수행할 위치를 선택합니다.", {
    client: "기본값입니다. 정렬 상태를 data 복사본에 적용합니다.",
    server: "data의 순서를 그대로 표시하고 헤더 상태와 변경 통지만 제공합니다. 소비자가 정렬 조건·페이지를 갱신하고 서버 결과를 data로 전달합니다. 이 모드에서도 sortable=true를 유지하세요.",
  }) },
  searchable: detail("검색어 입력과 통지를 제공합니다.", {
    "상태 책임":
      "검색어는 내부에 보관하지만 data를 자동 필터링하지 않습니다. 통지받은 검색어로 소비자가 요청 또는 필터링을 수행합니다.",
    시점: "일반 입력과 React·Native의 지우기는 300ms 뒤 통지합니다. Vue의 지우기는 예약된 검색을 취소하고 즉시 빈 문자열을 한 번 통지합니다. 종료 시 예약된 검색은 취소됩니다.",
  }),
  expandedRows: detail("펼친 행의 키 배열입니다.", {
    "제어 방식":
      "모든 플랫폼에서 undefined이면 내부 상태를 사용하고, []는 모두 닫힌 제어 상태입니다. 전달된 배열을 기준으로 다음 확장 상태를 계산합니다.",
    "상태 책임":
      "제어형으로 사용할 때는 update:expandedRows 또는 onExpandedRowsChange의 다음 배열을 expandedRows에 반영하세요. 통지를 무시하면 표시 상태는 바뀌지 않습니다. 내부 토글만 필요하면 prop을 생략하세요.",
  }),
  pagination: detail("페이지 표시와 이동 통지를 연결합니다.", {
    전달값:
      "{ page, total, pageSize? }. total은 전체 행 수이며 pageSize로 전체 페이지 수를 계산합니다. 이동 시 다음 페이지 번호를 통지하며 서버 요청과 data 교체는 소비자가 합니다.",
  }),
  responsive: detail("좁은 화면에서 card·compact 또는 전환 없음을 선택합니다.", {
    "적용 조건":
      "세 플랫폼 모두 화면 너비가 768px 미만일 때 모바일 표현으로 전환하고, 768px부터 표를 표시합니다. card에서는 cardTitle·cardSubtitle·cardSections와 열별 카드 표시 규칙을 적용합니다. mobileColumns는 compact 모드에서 표시할 열을 고릅니다. 전환 시 선택·확장 상태를 유지합니다.",
  }),
  formatValue: event(
    "기본 셀 표시를 포맷합니다.",
    "기본 셀을 렌더링할 때",
    "(value, column, row)",
    "ReactNode. 문자열 또는 표시할 요소를 반환합니다.",
    "renderCell → 열 render → 열 format → formatValue 순으로 처음 제공된 렌더 경로를 사용합니다. 원본 행 값을 변경하지 말고 표시 결과를 반환하세요.",
  ),
};
const selection = event(
  "다음 선택 행 객체 배열을 전달합니다.",
  "개별 행 선택·해제 또는 현재 범위 전체 선택·해제 시",
  "Row[]",
  "반환값은 사용하지 않습니다.",
  "selected에 전체 배열을 반영하세요.",
);
const sort = event(
  "정렬 상태가 변경됐음을 통지합니다.",
  "정렬 가능한 헤더를 실행한 다음",
  '{ key: string, order: "asc" | "desc" } — 정렬 없음은 key: ""',
  "반환값은 사용하지 않습니다.",
  "제어형에서는 다음 값을 sort에 반영하세요. sortMode=server에서는 정렬 요청과 페이지 초기화를 소비자가 수행합니다. Vue는 같은 조작에 update:sort 다음 sort-change를 한 번씩 통지하므로 서버 요청을 중복 연결하지 마세요.",
);
const search = event(
  "검색어를 통지합니다.",
  "입력 변경 후 300ms. Vue 지우기는 즉시 통지합니다.",
  "string",
  "반환값은 사용하지 않습니다.",
  "소비자가 data를 필터링하거나 재조회하세요.",
);
const expanded = event(
  "다음 확장 행 키 배열을 전달합니다.",
  "행 확장 토글 이후",
  "Array<string | number>",
  "반환값은 사용하지 않습니다.",
  "제어형에서는 expandedRows에 반영합니다. []를 전달하면 모든 행을 닫습니다.",
);
const retry = event(
  "데이터 재조회를 요청합니다.",
  "오류 표시의 재시도 버튼 실행 시",
  "없음",
  "반환값은 사용하지 않습니다.",
  "소비자가 요청을 시작하고 loading·error·resultKey를 갱신합니다.",
);
const types = [
  fields("TableSort", "세 플랫폼이 공유하는 정렬 상태입니다.", [
    ["key", "string", "열 key. 빈 문자열은 정렬 없음"],
    ["order", '"asc" | "desc"', "오름차순 또는 내림차순"],
  ]),
  fields("TableColumn<Row>", "열의 값과 표시·모바일 배치를 구성합니다.", [
    ["key / label", "string", "행 값 경로와 헤더 라벨"],
    ["sortable", "boolean", "표 sortable과 함께 허용해야 정렬 가능"],
    ["width / align", "number | string / left | center | right", "열 너비와 기본 셀 정렬"],
    ["render", "(value, row, index) → ReactNode", "React·Native의 해당 열 셀 표시"],
    ["format", "(value, row) → ReactNode", "React·Native의 열별 기본 포맷"],
    ["hideInCard / inlineInCard / fullWidthInCard", "boolean", "모바일 카드의 열 배치"],
    ["hideEmptyInCard / secondary", "boolean", "빈 값 숨김과 보조 값 표시"],
  ]),
];
export default {
  vue2: {
    ownership,
    types: [
      types[0],
      fields("Vue 열 구성", "열 key와 동적 슬롯 이름을 연결합니다.", [
        ["key / label", "string", "행 값 경로와 헤더 라벨"],
        ["sortable", "boolean", "표 정렬 허용과 함께 적용"],
        ["type", "string", "숫자·날짜 등 기본 셀 형식"],
        ["hideInCard / inlineInCard", "boolean", "모바일 카드의 열 표시 규칙"],
      ]),
    ],
    props: Object.fromEntries(Object.entries(common).filter(([key]) => key !== "formatValue")),
    events: {
      "selection-change": selection,
      "sort-change": sort,
      "update:sort": event("다음 정렬 상태를 전달합니다.", "헤더 조작 후 sort-change 이전", "TableSort", "반환값을 사용하지 않습니다.", ":sort.sync 또는 이벤트 핸들러로 sort에 반영하세요. 외부 prop 변경 자체는 이벤트를 발생시키지 않습니다."),
      search,
      "update:expandedRows": expanded,
      "row-click": event(
        "실행한 행과 표시 인덱스를 전달합니다.",
        "행 클릭 또는 행 자신에 포커스한 Enter·Space 실행 시. 내부 버튼의 키보드 이벤트는 행을 실행하지 않습니다.",
        "(row: Row, index: number)",
      ),
      "page-change": event(
        "이동할 페이지 번호를 전달합니다.",
        "페이지 이동 행동 시",
        "number",
        "반환값은 사용하지 않습니다.",
        "pagination.page와 data를 소비자가 갱신합니다.",
      ),
      "row-expand": event(
        "펼친 행을 전달합니다.",
        "내부 확장 배열을 변경한 뒤 update:expandedRows 이전",
        "Row",
      ),
      "row-collapse": event(
        "접은 행을 전달합니다.",
        "내부 확장 배열을 변경한 뒤 update:expandedRows 이전",
        "Row",
      ),
    },
    slots: {
      "selection-toolbar": slot("선택된 행에 대한 행동을 배치합니다.", "{ selected: Row[] }"),
      toolbar: slot("검색 입력 옆 도구를 배치합니다."),
      empty: slot("행이 없을 때 기본 안내를 교체합니다."),
      "cell-*": slot(
        "열별 셀 내용을 교체합니다.",
        "{ row: Row, value: 해당 열 값, index: 표시 인덱스 }",
        "열 key가 price면 #cell-price를 제공합니다. 모바일 TableCards에도 같은 슬롯 이름과 데이터를 전달합니다.",
      ),
      expand: slot("펼친 행의 상세 콘텐츠를 배치합니다.", "{ row: Row, index: 표시 인덱스 }"),
      "*": slot(
        "모바일 자식에 호출자의 슬롯을 전달합니다.",
        "원래 슬롯의 이름과 slotProps",
        "새 default 슬롯이 아닙니다. cell-* 등 실제 슬롯의 계약을 그대로 따릅니다.",
      ),
    },
  },
  react: {
    ownership,
    types,
    props: {
      ...common,
      onSelectionChange: selection,
      onSortChange: sort,
      onSearch: search,
      onExpandedRowsChange: expanded,
      onRetry: retry,
      onRowClick: event(
        "실행한 행과 표시 인덱스를 전달합니다.",
        "행 클릭·누름 또는 웹에서 행 자신에 포커스한 Enter·Space 실행 시. 내부 버튼의 키보드 이벤트는 행을 실행하지 않습니다.",
        "(row: Row, index: number)",
      ),
      onPageChange: event(
        "이동할 페이지 번호를 전달합니다.",
        "페이지 이동 행동 시",
        "number",
        "반환값은 사용하지 않습니다.",
        "pagination.page와 data를 소비자가 갱신합니다.",
      ),
      renderCell: slot(
        "표의 셀 표시를 교체합니다.",
        "(value, column: TableColumn<Row>, row: Row, index: number) → ReactNode",
        "모바일 카드의 기본 셀에도 적용됩니다. 행 객체는 변경하지 마세요.",
      ),
      renderExpand: slot(
        "펼친 행의 상세 내용을 반환합니다.",
        "(row: Row, index: number) → ReactNode",
      ),
      renderSelectionToolbar: slot(
        "선택 행에 대한 도구 영역을 반환합니다.",
        "(selected: Row[]) → ReactNode",
      ),
    },
  },
};
