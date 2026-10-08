import { detail, event, slot, fields } from "./helpers.mjs";
const ownership = [
  "선택값 value: 소비자가 소유합니다. 선택 콜백 결과를 value에 반영하세요. 단일은 옵션 값·null, 복수는 배열을 사용합니다.",
  "열림 상태: open이 boolean이면 소비자가 소유하고, 생략하거나 undefined이면 내부 상태를 사용합니다. 일반 선택·닫기 요청을 부모가 거절하면 팝업과 검색어를 유지하며 외부 prop 변경을 열림 이벤트로 되돌려 보내지 않습니다. 새 Modal·Drawer가 열려 소유 영역이 비활성화되면 닫기를 한 번 요청하고, 부모 상태와 무관하게 팝업을 숨깁니다. false로 반영한 뒤 다시 true로 열기 전에는 자동 복귀하지 않습니다.",
  "검색어·더 보기 제한·검색 포커스 위치: 실제 열림→닫힘 전이에 초기화합니다. 퇴장 애니메이션 완료를 기다리지 않습니다. 비활성화하면 비제어형 내부 열림을 해제하고, 제어형은 부모 open을 유지하면서 팝업을 숨깁니다.",
];
const common = {
  value: detail("현재 선택한 값 또는 값 배열입니다.", {
    "값 형태":
      "단일 선택에서 지우면 null, multiple에서 지우면 []를 전달합니다. 선택된 옵션 객체 전체가 아닌 valueKey로 읽은 값을 보관합니다.",
    연결: "multiple 변경 시 소비자도 단일·배열 형태를 맞춰야 합니다.",
  }),
  multiple: detail("여러 옵션을 선택합니다.", {
    "선택 동작":
      "선택한 항목을 배열에 추가·제거합니다. 단일 선택은 선택 후 닫고, 복수 선택은 선택을 계속할 수 있게 열림을 유지합니다.",
  }),
  open: {
    default: "내부 상태",
    ...detail("선택 팝업의 제어형 열림 여부입니다.", {
      "상태 책임":
        "생략하거나 undefined이면 내부적으로 열고 닫습니다. boolean을 제공하면 열림 변경 요청을 open에 반영해야 합니다. 외부 prop 변경은 다시 통지하지 않습니다. Vue에서 open을 초기값처럼 사용했다면 prop을 생략하거나 :open.sync로 연결하세요.",
    }),
  },
  valueKey: detail("옵션의 선택값과 렌더링 식별자로 사용할 필드입니다.", {
    "식별 규칙": "필터링 전에 값과 타입으로 식별합니다. 숫자 0과 문자열 0은 서로 다른 항목입니다. 문자열·숫자 키가 없으면 원본 배열 인덱스를 사용합니다.",
    "상태 보존": "필터링·재정렬·옵션 객체 재생성에도 같은 옵션의 내부 상태를 유지하려면 고유한 valueKey가 필요합니다. 목록에서 제거한 옵션의 상태는 보존하지 않습니다.",
  }),
  clearable: detail("현재 선택을 지울 수 있게 합니다.", {
    기본값:
      "패키지 기본값은 false입니다. 문서 기본 예제에서는 동작을 살펴볼 수 있도록 true로 설정합니다.",
    "전달 순서": "다음 선택값 통지 → 변경 통지 → clear 통지 순서입니다.",
  }),
  searchable: detail("옵션 목록 내부의 문자열 검색을 제공합니다.", {
    필터링:
      "labelKey로 읽은 라벨에 검색어가 포함되는 옵션을 표시합니다. 외부 서버 검색은 수행하지 않습니다.",
    기본값: "패키지 기본값은 false이며 문서 예제의 true 설정과 구분합니다.",
    "조합 입력": "React·Vue에서 조합 중 방향키·Enter·Escape는 입력기 기본 동작과 검색 포커스를 유지합니다. 상위 레이어로 키를 전달하지 않으며 조합 종료 후 정상 키 조작을 다시 처리합니다.",
  }),
};
const valueEvent = (label) =>
  event(
    "다음 선택값을 전달합니다.",
    "옵션 선택·해제 또는 지우기 시 호출합니다.",
    "단일: 옵션 값 또는 null / 복수: 옵션 값 배열",
    "반환값은 사용하지 않습니다.",
    `${label} 결과를 value에 반영하세요. 두 변경 콜백을 모두 연결하면 같은 값이 각각 통지됩니다.`,
  );
const types = [
  fields("SelectOption", "labelKey·valueKey로 읽을 옵션 객체입니다.", [
    ["label / labelKey", "string", "표시 라벨 필드"],
    ["value / valueKey", "string | number", "선택값 필드"],
    ["disabled", "boolean", "사용자가 선택할 수 없는 옵션"],
  ]),
];
export default {
  vue2: {
    ownership,
    types,
    props: common,
    events: {
      input: valueEvent("input"),
      change: valueEvent("change"),
      "update:open": event(
        "다음 팝업 열림 여부를 통지합니다.",
        "트리거 실행, 단일 옵션 선택, Escape·바깥 클릭 등 사용자 행동이 다른 열림 상태를 요청할 때",
        "boolean",
        "반환값은 사용하지 않습니다.",
        "open을 전달했다면 .sync 또는 update:open에서 갱신하세요. 선택 시 input → change 이후 닫힘을 통지합니다.",
      ),
      search: event(
        "옵션 검색어를 통지합니다.",
        "내부 검색어가 변경될 때",
        "string",
        "반환값은 사용하지 않습니다.",
        "필터는 내부에서 적용합니다. 서버 요청을 자동 실행하지 않습니다.",
      ),
      clear: event("선택 지우기를 통지합니다.", "input과 change로 빈 선택을 전달한 다음", "없음"),
    },
    slots: {
      selected: slot(
        "선택한 옵션의 표시를 교체합니다.",
        "{ option: 선택된 옵션 | undefined, label: 기본 표시 문자열 }",
      ),
      option: slot(
        "옵션 내용을 교체합니다.",
        "{ option: 옵션 객체, selected: boolean }",
        "옵션의 선택·비활성 동작은 Select가 처리합니다. 별도 선택 상태를 슬롯 안에 중복 보관하지 마세요.",
      ),
      "menu-header": slot("옵션 메뉴 위에 콘텐츠를 배치합니다."),
    },
  },
  react: {
    ownership,
    types,
    props: {
      ...common,
      onValueChange: valueEvent("onValueChange"),
      onChange: valueEvent("onChange"),
      onOpenChange: event(
        "다음 팝업 열림 여부를 전달합니다.",
        "트리거·선택·닫기 행동 시",
        "boolean",
        "반환값은 사용하지 않습니다.",
        "제어형 open을 전달했다면 이 값으로 갱신합니다. onValueChange → onChange 후 단일 선택에서는 닫힘을 통지합니다.",
      ),
      onSearch: event("내부 옵션 검색어를 전달합니다.", "검색 입력 변경 시", "string"),
      onClear: event("선택 지우기를 통지합니다.", "onValueChange → onChange 이후", "없음"),
      renderOption: slot(
        "옵션 표시 내용을 반환합니다.",
        "(option: T, selected: boolean) → ReactNode",
      ),
      renderSelected: slot(
        "선택한 옵션의 표시를 반환합니다.",
        "(option: T | undefined) → ReactNode",
        "선택이 없을 수 있습니다. 기본 표시를 사용하려면 반환하지 않아도 됩니다.",
      ),
    },
  },
};
