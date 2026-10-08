import { part as p, textPart as t, type GuideAuthor } from "./types.ts";
export const feedback: Record<string, GuideAuthor> = {
  DsAlert: {
    parts: [
      p(
        "알림 영역",
        "상태 의미와 관련 설명을 본문 위치에 표시합니다.",
        '[role="alert"], [role="status"], .ds-alert, .kjun-alert',
      ),
      t("제목", "상태를 짧게 요약합니다.", "안내", true),
      t("설명", "현재 상황과 다음 행동을 설명합니다.", "작업 상태를 설명하는 문장입니다."),
      p("닫기", "현재 알림을 숨깁니다.", '[aria-label="닫기"], [aria-label="알림 닫기"]', true),
    ],
    related: "feedback",
  },
  DsChartSkeleton: {
    parts: [p("차트 자리 표시자", "완료 후 차트가 차지할 공간과 형태를 미리 보여줍니다.")],
    related: "loading",
  },
  DsDataState: {
    parts: [
      t("조회 콘텐츠", "현재 결과 키에 해당하는 소비자 콘텐츠입니다.", "조회 결과"),
      t(
        "결과 본문",
        "로딩·빈 결과·실패 조건에 따라 표시되는 본문입니다.",
        "이전 결과와 현재 조건을 구분합니다.",
      ),
    ],
    related: "loading",
  },
  DsErrorBoundary: {
    parts: [
      p(
        "소비자 콘텐츠",
        "정상 상태에는 자식을 그대로 표시합니다. 이 Alert는 예제가 제공한 콘텐츠이며 ErrorBoundary 자체 외형이 아닙니다.",
        '[role="alert"], [role="status"], .ds-alert, .kjun-alert',
      ),
    ],
    related: "loading",
  },
  DsFormSkeleton: {
    parts: [p("폼 자리 표시자", "라벨과 필드가 배치될 공간을 묶어서 보여줍니다.")],
    related: "loading",
  },
  DsListSkeleton: {
    parts: [p("목록 자리 표시자", "목록 항목의 반복 구조와 메타 정보 자리를 보여줍니다.")],
    related: "loading",
  },
  DsProgress: {
    parts: [
      t("작업 라벨", "진행률이 가리키는 작업을 설명합니다.", "완료율", true),
      p("진행 막대", "최대값에 대한 현재 진행량입니다.", '[role="progressbar"]'),
      t("진행 수치", "진행 정도를 숫자로도 전달합니다.", "42%", true),
    ],
    related: "loading",
  },
  DsSkeleton: {
    parts: [
      p(
        "콘텐츠 자리 표시자",
        "예제는 카드 형태입니다. type으로 실제 콘텐츠에 맞는 형태를 선택합니다.",
      ),
    ],
    related: "loading",
  },
  DsSpinner: {
    parts: [
      p(
        "진행 표시",
        "완료 시점을 알 수 없는 진행 중 작업을 표시합니다.",
        '[role="status"], [role="progressbar"], .catalog-render svg',
      ),
      t("진행 문구", "어떤 작업을 기다리는지 설명합니다.", "조회 중", true),
    ],
    related: "loading",
  },
  DsTooltip: {
    action: "hover:도움말",
    parts: [
      t("트리거", "보조 설명이 연결된 컨트롤입니다.", "도움말"),
      p(
        "도움말",
        "hover 또는 키보드 포커스에서 제공하는 짧은 보조 설명입니다.",
        '[role="tooltip"]',
      ),
    ],
    related: "layers",
  },
  KjunFeedbackProvider: {
    description: "작업 결과를 짧게 알리고 정해진 시간이 지나면 닫힙니다.",
    captureParts: true,
    action: "Toast 표시",
    settings: {
      service: "Toast",
      duration: 0,
      title: "저장 완료",
      message: "변경 사항을 저장했습니다.",
    },
    parts: [
      t("알림 제목", "작업 결과를 요약합니다.", "저장 완료", true),
      t("알림 메시지", "현재 작업의 결과를 설명합니다.", "변경 사항을 저장했습니다."),
    ],
    related: "feedback",
    figures: [
      {
        id: "confirm",
        label: "Confirm",
        description: "결정이 필요한 작업을 확인하거나 취소합니다.",
        settings: {
          service: "Confirm",
          confirmTitle: "변경 사항을 저장할까요?",
          confirmMessage: "확인하면 입력한 내용을 저장합니다.",
        },
        action: "Confirm 요청",
        parts: [
          t("제목", "결정할 내용을 질문합니다.", "변경 사항을 저장할까요?"),
          t("확인 행동", "요청한 작업에 동의합니다.", "확인"),
          t("취소 행동", "작업을 진행하지 않고 돌아갑니다.", "취소"),
        ],
      },
      {
        id: "prompt",
        label: "Prompt",
        description: "짧은 입력을 받고 소비자가 검증합니다.",
        settings: {
          service: "Prompt",
          promptTitle: "목록 이름 입력",
          promptMessage: "두 글자 이상의 이름을 입력하세요.",
        },
        action: "Prompt 요청",
        parts: [
          t("제목", "입력 목적을 설명합니다.", "목록 이름 입력"),
          p("입력", "반환할 문자열을 입력합니다.", "input"),
          t("확인 행동", "검증 후 입력값을 반환합니다.", "확인"),
        ],
      },
    ],
  },
};
