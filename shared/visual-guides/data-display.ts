import { part as p, textPart as t, type GuideAuthor } from "./types.ts";
export const dataDisplay: Record<string, GuideAuthor> = {
  DsAnimatedNumber: {
    parts: [
      p(
        "숫자와 단위",
        "현재 값을 서식과 단위로 표시합니다. 값 변경 시 숫자가 전환됩니다.",
        ".catalog-render > :first-child",
      ),
    ],
    related: "assets",
  },
  DsBadge: {
    parts: [t("상태 라벨", "짧은 상태를 텍스트와 색상 역할로 전달합니다.", "success")],
    related: "assets",
  },
  DsEmpty: {
    parts: [
      t("제목", "결과가 없는 상황을 설명합니다.", "항목이 없습니다"),
      t("설명", "가능한 다음 행동을 안내합니다.", "조건을 바꾸거나 새 항목을 추가하세요.", true),
      t("소비자 행동", "빈 상태에서 진행할 행동입니다.", "추가", true),
    ],
    related: "writing",
  },
  DsHeatmapCell: {
    parts: [t("수치 셀", "같은 범위의 상대적 크기를 색상과 숫자로 표현합니다.", "-0.5")],
    related: "assets",
  },
  DsIcon: {
    parts: [
      p(
        "아이콘 도형",
        "의미를 보조하는 단일 도형입니다. 아이콘 전용 행동은 소비자가 접근성 이름을 연결합니다.",
        "svg",
      ),
    ],
    related: "toolbar",
  },
  DsKpiHero: {
    parts: [
      t("지표 라벨", "대표 수치의 의미입니다.", "총 평가 금액"),
      t("대표 수치", "가장 중요한 지표를 우선 표시합니다.", "123,456,789"),
      t("비교 기준", "변화량을 해석할 기준입니다.", "전일 대비", true),
    ],
    related: "assets",
  },
  DsKpiRow: {
    parts: [
      t("지표 이름", "나란히 배치한 수치의 의미입니다.", "평가 금액"),
      t("단위", "수치의 단위를 표시합니다.", "원"),
      t("상태 지표", "수치 외의 상태도 함께 배치할 수 있습니다.", "정상", true),
    ],
    related: "assets",
  },
  DsProgressCell: {
    parts: [t("진행 수치", "최대값에 대한 진행량을 표시합니다.", "42%")],
    related: "assets",
  },
  DsSparkline: {
    parts: [p("추세 선", "같은 항목의 값 변화 흐름을 압축해 표시합니다.", "svg")],
    related: "assets",
  },
  DsTable: {
    parts: [
      t("열 제목", "열에 표시할 값을 설명하며 정렬 진입점을 제공합니다.", "이름"),
      t("행 데이터", "한 항목의 값들을 같은 행으로 묶습니다.", "긴 한국어 자산 이름"),
      p(
        "행 선택",
        "선택 작업에 포함할 행을 표시합니다.",
        '[aria-label="행 선택 1"], tbody input[type="checkbox"]',
        true,
      ),
    ],
    related: "assets",
  },
};
