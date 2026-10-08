import { detail, event, slot, fields } from "./helpers.mjs";
const ownership = [
  "value: 소비자가 보유한 문자열입니다. 입력·선택 통지로 받은 문자열을 반영합니다.",
  "검색어 초안·팝업·요청 중 상태·결과 목록: 컴포넌트 내부에서 관리합니다. 직접 제어하는 open prop은 없습니다.",
  "인증·URL·응답 변환·실제 데이터 요청: loadOptions를 제공하는 소비자의 책임입니다. 취소 signal을 요청에 연결하세요.",
];
const common = {
  loadOptions: {
    ...event(
      "자동 완성 옵션을 비동기로 가져옵니다.",
      "자동 완성이 열려 있고 검색어가 minChars 이상인 상태에서 300ms 후 실행합니다.",
      "query: 검색 문자열, context.signal: 해당 요청의 AbortSignal",
      "표시할 옵션 배열을 반환하는 Promise. 인증·응답 변환은 함수 안에서 처리하세요.",
      "새 검색·닫힘·해제 시 이전 요청을 취소하고 늦은 결과를 무시합니다. 열린 상태에서 요청 함수를 변경하면 현재 검색어로 다시 검색합니다. 불필요한 재요청을 줄이려면 함수 참조를 안정적으로 유지하세요.",
    ),
  },
  debounce: detail("일반 입력 모드의 값 변경 통지 지연 시간(ms)입니다.", {
    "적용 조건":
      "loadOptions가 없을 때만 적용됩니다. 자동 완성 요청 지연은 고정 300ms이며 이 prop으로 변경되지 않습니다.",
    "상태 책임": "지연 중에는 입력 초안을 내부에 보관하고, 지연이 끝나면 입력 변경을 통지합니다. 모든 플랫폼에서 외부 value·disabled·debounce·입력 모드 변경 또는 해제 시 대기 중 통지를 취소합니다.",
  }),
  minChars: detail("자동 완성 요청을 시작할 최소 길이입니다.", {
    "적용 조건":
      "기본값은 2입니다. 길이가 미달하면 결과를 비우며 진행 중인 이전 요청은 취소합니다. 열린 상태에서 minChars를 변경하면 현재 검색어를 다시 평가하며, 기준을 낮춰 길이가 충족되면 다시 검색합니다. 일반 입력 모드에는 적용하지 않습니다.",
  }),
  value: detail("외부에서 보유한 검색 문자열입니다.", {
    "선택 결과":
      "결과를 선택하면 labelField로 읽은 라벨 문자열을 값 변경으로 전달하고, select 계열 콜백에는 원본 옵션 객체를 별도로 전달합니다.",
  }),
  itemKey: detail("검색 결과의 반복 렌더링 key 필드입니다.", {
    "입력 계약":
      "모든 플랫폼에서 기본값은 id입니다. 결과 안에서 고유하고 안정된 string 또는 number 값을 제공하세요. 숫자 0도 유효하며 문자열 키와 구분합니다. 필드가 없으면 위치 인덱스로 대체하므로 항목의 식별자를 제공하는 것을 권장합니다.",
  }),
  labelField: detail("검색 결과에서 라벨을 읽을 필드입니다.", {
    "입력 계약":
      "기본값은 name입니다. 결과 객체에 문자열 라벨을 제공하세요. Vue는 필드가 없으면 빈 문자열을 통지하고 React·Native는 옵션 라벨 헬퍼를 사용합니다.",
  }),
};
const changed = event(
  "현재 입력 문자열을 통지합니다.",
  "입력·결과 선택·지우기 시. 일반 타이핑은 debounce 이후, 지우기는 지연 없이 한 번 통지합니다.",
  "string",
  "반환값은 사용하지 않습니다.",
  "value에 반영합니다. 자동 완성 선택 시 값 변경 → 선택 객체 통지 순서입니다.",
);
const selected = event(
  "선택한 결과 객체를 전달합니다.",
  "결과 클릭·누름 또는 활성 결과를 Enter로 선택할 때",
  "loadOptions가 반환한 원본 옵션 객체",
  "반환값은 사용하지 않습니다.",
  "선택 후 팝업을 닫습니다. 문자열은 앞선 값 변경 통지로 받습니다.",
);
const error = event(
  "현재 요청의 실패를 전달합니다.",
  "취소되지 않은 현재 loadOptions 요청이 reject될 때",
  "unknown: 요청 함수가 던진 오류",
  "반환값은 사용하지 않습니다.",
  "실패한 검색 결과를 비웁니다. 취소·이전 요청의 실패는 사용자 오류로 통지하지 않습니다.",
);
const cleared = event(
  "검색어 지우기를 통지합니다.",
  "빈 문자열 값 변경 통지 다음",
  "없음",
  "반환값은 사용하지 않습니다.",
  "검색 중에도 지우기를 사용할 수 있습니다. 자동 완성 결과와 진행 중인 요청을 정리하고 팝업을 닫습니다. 대기 중인 일반 입력 통지도 취소합니다. 빈 문자열 값 변경 한 번 → clear 한 번 순서입니다.",
);
const types = [
  fields("검색 결과 T", "소비자가 변환해 반환하는 검색 결과 객체입니다.", [
    ["name / labelField", "string", "선택 후 입력값으로 사용할 라벨"],
    ["itemKey 필드", "string | number", "모든 플랫폼의 목록 반복 렌더링에 사용할 안정된 키"],
  ]),
];
export default {
  vue2: {
    ownership,
    types,
    props: common,
    events: { input: changed, select: selected, "search-error": error, clear: cleared },
    slots: {
      item: slot(
        "검색 결과의 표시 내용을 교체합니다.",
        "{ item: 결과 객체, index: 결과 목록 인덱스 }",
        "선택·방향키 이동은 SearchInput이 처리합니다. 슬롯은 콘텐츠 표시를 담당합니다.",
      ),
    },
  },
  react: {
    ownership,
    types,
    props: {
      ...common,
      onValueChange: changed,
      onSelect: selected,
      onSearchError: error,
      onClear: cleared,
      onEnter: event(
        "입력의 Enter 행동을 통지합니다.",
        "일반 입력의 Enter 또는 자동 완성에서 활성 결과를 선택하지 않는 Enter 경로",
        "없음",
        "반환값은 사용하지 않습니다.",
        "활성 결과를 Enter로 선택하면 onSelect만 호출하며 onEnter를 중복 호출하지 않습니다. 활성 결과가 없으면 onEnter로 제출 동작을 처리합니다.",
      ),
      renderOption: slot("검색 결과 내용을 반환합니다.", "(option: T) → ReactNode"),
    },
  },
};
