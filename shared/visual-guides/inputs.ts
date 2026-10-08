import { part as p, textPart as t, control as c, type GuideAuthor } from "./types.ts";
const field = p("입력 영역", "현재 값과 입력 위치를 표시합니다.", "input, textarea");
export const inputs: Record<string, GuideAuthor> = {
  DsCheckbox: {
    parts: [
      c("선택 컨트롤", "선택 여부를 표시하고 변경합니다.", "checkbox"),
      t("라벨", "선택할 내용의 의미를 설명합니다.", "알림 받기"),
    ],
    related: "form",
  },
  DsCombobox: {
    parts: [field],
    related: "selection",
    figures: [
      {
        id: "open",
        label: "후보 목록",
        description: "입력 중 검색어와 확정할 후보를 구분합니다.",
        action: "click-label:자산 선택",
        parts: [
          t("후보", "확정할 수 있는 옵션입니다.", "한빛테크"),
          t("비활성 후보", "목록에 있지만 선택할 수 없는 항목입니다.", "그린에너지"),
        ],
      },
    ],
  },
  DsDatePicker: {
    parts: [
      p(
        "날짜 컨트롤",
        "선택한 날짜와 날짜 선택 진입점을 표시합니다.",
        'input, button, [role="button"]',
      ),
    ],
    related: "form",
  },
  DsFilterGroup: {
    parts: [
      c("필터 항목", "현재 적용한 필터 조건을 표시합니다."),
      t("조건 라벨", "필터가 포함할 대상을 설명합니다.", "사과"),
    ],
    related: "toolbar",
  },
  DsFormGroup: {
    parts: [
      t("라벨", "자식 입력의 목적을 설명하고 접근성 이름에 연결합니다.", "내용"),
      field,
      t(
        "보조 설명",
        "입력 방법을 안내합니다. 오류가 있으면 오류가 우선합니다.",
        "도움말을 입력에 연결합니다.",
        true,
      ),
    ],
    related: "form",
    figures: [
      {
        id: "error",
        label: "오류가 있는 필드",
        description: "FormGroup의 오류 안내와 자식 Input의 오류 표현을 연결합니다.",
        settings: { errorMessage: "내용을 입력해 주세요." },
        parts: [
          field,
          t(
            "오류 설명",
            "문제와 수정 방법을 설명하며 hint 대신 표시됩니다.",
            "내용을 입력해 주세요.",
            true,
          ),
        ],
      },
    ],
  },
  DsInput: {
    parts: [t("소비자 라벨", "이 예제는 FormGroup으로 목적을 연결합니다.", "목록 이름"), field],
    related: "form",
    figures: [
      { id: "sizes", label: "버튼과 같은 크기 규격", description: "sm 32px, md 40px, lg 48px이며 같은 크기의 버튼과 모서리를 공유합니다.", settings: { comparison: "크기" }, parts: [field] },
      { id: "states", label: "채워진 면과 상태", description: "기본·입력됨·오류·읽기 전용·비활성을 비교합니다. 포커스 중에도 채워진 면을 유지합니다.", settings: { comparison: "상태" }, parts: [field] },
      { id: "affixes", label: "아이콘과 단위", description: "앞뒤 콘텐츠와 입력값 사이에 8px 이상을 확보합니다.", settings: { comparison: "아이콘·단위" }, parts: [field] },
    ],
  },
  DsRadio: {
    parts: [
      c("선택 컨트롤", "RadioGroup 안에서 하나의 항목을 고릅니다.", "radio"),
      t("라벨", "해당 선택지를 설명합니다.", "첫 선택"),
    ],
    related: "form",
  },
  DsRadioGroup: {
    parts: [
      p("선택 그룹", "하나의 선택값을 공유하는 라디오 집합입니다.", '[role="radiogroup"]'),
      c("선택지", "그룹의 개별 라디오입니다.", "radio"),
    ],
    related: "form",
  },
  DsSearchInput: {
    parts: [field],
    related: "selection",
    figures: [
      {
        id: "results",
        label: "검색 결과",
        description: "로컬 샘플 요청으로 AAA의 후보를 조회한 화면입니다.",
        action: "search:AAA",
        parts: [
          p(
            "검색 결과",
            "조회 함수가 반환한 후보를 보여줍니다.",
            '[role="option"], [role="radio"]',
          ),
        ],
      },
    ],
  },
  DsSelect: {
    parts: [
      p(
        "선택 컨트롤",
        "현재 선택값 또는 선택 안내와 열기 동작을 제공합니다.",
        '[role="combobox"], [aria-label="공개 범위"]',
      ),
    ],
    figures: [
      {
        id: "open",
        label: "열린 선택 목록",
        description: "검색을 켠 예제입니다. searchable의 패키지 기본값은 false입니다.",
        action: "click-label:공개 범위",
        parts: [
          p("후보 검색", "제공된 options 안에서 후보를 좁힙니다.", "input", true),
          t("선택지", "선택할 값과 연결된 라벨입니다.", "나만 보기"),
          t("비활성 선택지", "선택할 수 없는 후보입니다.", "전체 공개", true),
        ],
      },
    ],
    related: "selection",
  },
  DsSwitch: {
    parts: [
      c("전환 컨트롤", "켜짐과 꺼짐을 전환합니다.", "switch"),
      t("라벨", "전환하는 설정을 설명합니다.", "자동 갱신"),
    ],
    related: "form",
  },
  DsTextarea: { parts: [field], related: "form" },
};
