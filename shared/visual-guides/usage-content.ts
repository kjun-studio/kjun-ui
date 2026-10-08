import { extensionLayouts } from "./extension-usage.ts";
import { visual, type GuideCase } from "./types.ts";
export const comparisons = [
  {
    id: "selection",
    title: "Select · Combobox · SearchInput",
    situation: "사용자가 많은 후보 중 하나의 자산이나 분류를 고르는 상황입니다.",
    rows: [
      [
        "DsSelect",
        "미리 제공한 선택지",
        "소비자가 options와 선택값을 연결합니다. searchable은 선택지 안의 검색입니다. 복수 선택도 지원합니다.",
      ],
      [
        "DsCombobox",
        "입력하면서 후보 선택",
        "입력 중 검색어와 확정한 선택값을 구분합니다. options와 필터링·검색 통지를 소비자가 연결합니다.",
      ],
      [
        "DsSearchInput",
        "입력에 따른 비동기 후보 조회",
        "loadOptions에서 요청과 응답 변환을 수행합니다. 최소 글자 수·취소·늦은 응답 처리를 API에서 확인하세요.",
      ],
    ],
  },
  {
    id: "layers",
    title: "Modal · Drawer · Popover",
    situation: "현재 화면에서 자산 목록의 설명을 확인하거나 내용을 편집하는 상황입니다.",
    rows: [
      [
        "DsModal",
        "집중해서 확인하거나 입력",
        "현재 흐름을 잠시 멈추고 한 작업을 완료합니다. 확인 요청과 실제 저장 완료를 구분합니다.",
      ],
      [
        "DsDrawer",
        "넓거나 연속적인 편집 영역",
        "화면 가장자리의 패널을 사용합니다. 패널을 열었다고 배경과 동시에 조작할 수 있는 것은 아닙니다.",
      ],
      [
        "DsPopover",
        "트리거에 관련된 보조 정보",
        "웹에서는 트리거와의 배치를 사용합니다. Native는 Modal 기반이므로 웹과 같은 배치를 가정하지 않습니다.",
      ],
    ],
  },
  {
    id: "feedback",
    title: "Alert · Toast",
    situation: "설정 저장의 결과나 현재 화면에서 해결해야 하는 문제를 알려주는 상황입니다.",
    rows: [
      [
        "DsAlert",
        "본문에 남아야 하는 상태 설명",
        "관련 입력이나 콘텐츠 근처에 표시합니다. 사용자가 메시지와 다음 행동을 다시 확인할 수 있게 합니다.",
      ],
      [
        "KjunFeedbackProvider",
        "방금 수행한 작업의 결과 통지",
        "Toast로 짧게 통지합니다. 반드시 해결해야 할 문제나 중요한 안내를 자동 종료 알림에만 두지 않습니다.",
      ],
    ],
  },
  {
    id: "loading",
    title: "Spinner · Skeleton · DataState",
    situation: "자산 목록을 처음 조회하거나 같은 조건으로 다시 가져오는 상황입니다.",
    rows: [
      [
        "DsSpinner",
        "진행 중임을 간단히 표시",
        "작업의 이름을 함께 제공합니다. Spinner는 요청 수행이나 완료 판정을 담당하지 않습니다.",
      ],
      [
        "DsSkeleton",
        "로드될 콘텐츠의 형태 안내",
        "완료 후 콘텐츠와 비슷한 구조로 공간을 확보합니다. 정확한 완료 시간을 나타내지 않습니다.",
      ],
      [
        "DsDataState",
        "조회 상태에 따른 화면 전환",
        "queryKey·resultKey로 최초 조회·조건 변경·같은 조건 갱신을 구분합니다. 요청과 재시도 처리는 소비자가 연결합니다.",
      ],
    ],
  },
];
export const layouts = [
  ...extensionLayouts,
  {
    id: "form",
    name: "GuideSettingsForm",
    title: "설정 폼",
    description: "라벨·설명·오류는 해당 입력 옆에 두고, 주요 저장 행동과 초기화를 구분합니다.",
  },
  {
    id: "toolbar",
    name: "GuideSearchToolbar",
    title: "검색 툴바",
    description:
      "검색 대상과 적용한 필터를 함께 보여줍니다. 긴 라벨은 줄바꿈하고 좁은 화면에서는 행동을 다음 줄로 보냅니다.",
  },
  {
    id: "assets",
    name: "GuideAssetList",
    title: "자산 목록",
    description:
      "이름·종목 코드·가격·변동률의 위계를 구분합니다. 숫자는 단위를 포함하고 열의 정렬 기준을 유지합니다.",
  },
];
export const writing = [
  {
    name: "DsButton",
    title: "버튼은 결과가 보이는 동사로",
    before: "확인",
    after: "변경 사항 저장",
    explanation:
      "주변 맥락 없이 읽어도 어떤 행동인지 알 수 있게 씁니다. 같은 화면의 주요 행동을 구분하세요.",
  },
  {
    name: "DsFormGroup",
    title: "오류는 수정 방법까지",
    before: "입력 오류",
    after: "목록 이름을 입력해 주세요.",
    explanation: "실패를 알리는 데서 그치지 않고 사용자가 고칠 수 있는 내용을 말합니다.",
  },
  {
    name: "DsEmpty",
    title: "빈 상태에는 가능한 다음 행동을",
    before: "데이터 없음",
    after: "조건에 맞는 항목이 없습니다",
    explanation:
      "검색 결과가 없으면 필터 초기화, 처음 사용하는 화면이면 첫 항목 추가를 연결합니다. 조회 실패는 재시도 안내로 구분합니다.",
  },
];
export const recommendations: Record<string, [string, string]> = {
  DsButton: [
    "한 영역의 주요 행동을 명확히 하고 실행 결과를 문구로 설명합니다.",
    "모든 행동을 같은 강조 수준이나 “확인”이라는 문구로 표시하지 않습니다.",
  ],
  DsInput: [
    "FormGroup 라벨과 설명을 입력에 연결합니다.",
    "placeholder만으로 필드의 목적을 설명하지 않습니다.",
  ],
  DsFormGroup: [
    "자식 입력의 오류 표현과 오류 설명을 함께 연결합니다.",
    "required 표시를 실제 필수 검증으로 간주하지 않습니다.",
  ],
  DsSelect: [
    "제공한 후보 안에서 값을 고르는 목적과 복수 선택 여부를 명시합니다.",
    "searchable만으로 외부 서버 조회가 실행된다고 가정하지 않습니다.",
  ],
  DsCombobox: [
    "입력 중 검색어와 확정한 선택값을 구분해 연결합니다.",
    "입력한 문자열이 곧 유효한 선택값이라고 가정하지 않습니다.",
  ],
  DsSearchInput: [
    "후보 조회의 실패·빈 결과·취소를 구분합니다.",
    "긴 요청 결과로 최신 입력 결과를 덮어쓰지 않습니다.",
  ],
  DsModal: [
    "제목과 주요 행동이 하나의 작업을 가리키도록 합니다.",
    "저장이 끝나기 전에 성공으로 간주해 닫지 않습니다.",
  ],
  DsDrawer: [
    "패널 안의 작업 범위와 닫은 후 돌아갈 위치를 명확히 합니다.",
    "Drawer를 항상 배경과 동시 조작 가능한 영역으로 설명하지 않습니다.",
  ],
  DsPopover: [
    "트리거와 직접 관련된 짧은 정보와 행동을 담습니다.",
    "중요한 설명을 hover에서만 발견할 수 있게 두지 않습니다.",
  ],
  DsAlert: [
    "해결할 문제와 다음 행동을 관련 콘텐츠 가까이 표시합니다.",
    "색상만으로 성공·실패를 구분하지 않습니다.",
  ],
  DsSpinner: [
    "조회 중인 작업을 문구로 설명합니다.",
    "오래 기다리는 화면에 이유 없는 회전 표시만 두지 않습니다.",
  ],
  DsSkeleton: [
    "완료 화면과 비슷한 콘텐츠 구조를 사용합니다.",
    "실제 결과와 무관한 형태로 화면을 채우지 않습니다.",
  ],
  DsDataState: [
    "조건과 결과 키를 성공한 데이터와 함께 갱신합니다.",
    "다른 조건의 이전 결과를 최신 결과인 것처럼 보여주지 않습니다.",
  ],
  DsTable: [
    "이름과 수치의 위계를 유지하고 좁은 화면에서는 카드 표현을 검토합니다.",
    "긴 이름이나 큰 숫자를 축소 배율로 눌러 넣지 않습니다.",
  ],
  DsEmpty: [
    "현재 상황과 다음에 할 수 있는 행동을 함께 제공합니다.",
    "검색 결과 없음과 요청 실패에 같은 문구를 사용하지 않습니다.",
  ],
  KjunFeedbackProvider: [
    "짧은 결과 통지는 Toast, 결정과 입력은 Confirm·Prompt로 구분합니다.",
    "필수 안내를 자동 종료 Toast에만 남기지 않습니다.",
  ],
};

export function comparisonCase(name: string): GuideCase {
  const scenario: GuideCase = {
    id: "choose-" + name,
    label: name === "KjunFeedbackProvider" ? "Toast" : name.slice(2),
    description: "선택한 플랫폼의 실제 실행 예제입니다.",
  };
  if (["DsSelect", "DsCombobox"].includes(name))
    scenario.settings = visual(name, {
      options: [
        { value: "a", label: "긴 한국어 자산 이름 · AAA" },
        { value: "b", label: "두 번째 자산 · BBB" },
        { value: "c", label: "세 번째 자산 · CCC" },
      ],
      ariaLabel: "자산 선택",
    });
  if (name === "KjunFeedbackProvider")
    scenario.settings = {
      service: "Toast",
      duration: 0,
      title: "저장 완료",
      message: "변경 사항을 저장했습니다.",
    };
  if (name === "DsAlert")
    scenario.settings = visual(
      name,
      { title: "저장 완료", type: "success" },
      "변경 사항을 저장했습니다.",
    );
  if (name === "DsSkeleton") scenario.settings = visual(name, { type: "table" });
  if (name === "DsDataState") scenario.settings = { queryState: "최초 로딩" };
  return scenario;
}

export function writingCase(rule: (typeof writing)[number], good: boolean): GuideCase {
  const text = good ? rule.after : rule.before;
  const settings =
    rule.name === "DsButton"
      ? visual(rule.name, {}, text)
      : rule.name === "DsFormGroup"
        ? { errorMessage: text }
        : visual(rule.name, {
            text,
            description: good ? "필터를 초기화해 전체 항목을 확인하세요." : "",
          });
  if (rule.name === "DsEmpty")
    settings.visual = JSON.stringify({
      ...JSON.parse(typeof settings.visual === "string" ? settings.visual : "{}"),
      DsButton: { props: {}, text: good ? "필터 초기화" : "확인" },
    });
  return {
    id: good ? "recommended" : "avoid",
    label: good ? "권장" : "피하기",
    description: text,
    settings,
  };
}
export const usageScenarios = [
  ...comparisons.flatMap((comparison) =>
    comparison.rows.map(([name]) => ({ name, scenario: comparisonCase(name) })),
  ),
  ...writing.flatMap((rule) =>
    [false, true].map((good) => ({ name: rule.name, scenario: writingCase(rule, good) })),
  ),
];
