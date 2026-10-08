import { part as p, textPart as t, type GuideAuthor } from "./types.ts";
export const finance: Record<string, GuideAuthor> = {
  DsCollectionMark: {
    parts: [
      p(
        "수집 표시",
        "즐겨찾기·관심 등록 여부를 표시하는 아이콘입니다. 클릭 토글은 별도 컴포넌트입니다.",
        "svg",
      ),
    ],
    related: "assets",
  },
  DsDeviation: {
    parts: [t("괴리율", "부호와 백분율로 차이의 방향과 크기를 함께 표시합니다.", "+2.35%")],
    related: "assets",
  },
  DsExecutionStatusBadge: {
    parts: [t("실행 상태", "작업의 대기·진행·완료·실패를 명시적인 문구로 표시합니다.", "실행 중")],
    related: "assets",
  },
  DsFreshness: {
    parts: [t("신선도 표시", "가격의 시점이나 출처에 관한 보조 정보입니다.", "종가")],
    related: "assets",
  },
  DsMarketCards: {
    parts: [
      t("자산 이름", "카드가 나타내는 자산을 식별합니다.", "긴 한국어 자산 이름"),
      t("보조 식별자", "종목 코드로 긴 이름을 보완합니다.", "AAA"),
      t("지표 선택", "카드에서 비교할 지표를 고릅니다.", "변동"),
    ],
    related: "assets",
  },
  DsMarketListPanel: {
    parts: [
      t("목록 필터", "소비자가 제공하는 목록 제어 영역입니다.", "사과"),
      t("자산 이름", "목록 항목의 주된 식별 정보입니다.", "긴 한국어 자산 이름"),
      t("가격", "단위와 형식을 적용한 가격입니다.", "1,234,567원"),
    ],
    related: "assets",
  },
  DsMarketSimpleList: {
    parts: [
      t("자산 이름", "목록 항목의 주된 식별 정보입니다.", "긴 한국어 자산 이름"),
      t("종목 코드", "이름을 보완하는 식별 정보입니다.", "AAA"),
      t("가격", "서식을 적용한 가격과 단위입니다.", "1,234,567원"),
    ],
    related: "assets",
  },
  DsMarketTable: {
    parts: [
      t("열 제목", "비교할 데이터의 기준입니다.", "가격"),
      t("자산 이름", "각 행의 자산을 식별합니다.", "긴 한국어 자산 이름"),
      t("가격 셀", "소비자 서식에 맞춘 가격입니다.", "1,234,567원"),
    ],
    related: "assets",
  },
  DsMarketTableSkeleton: {
    parts: [
      t("열 제목", "조회 중에도 유지하는 열 구조입니다.", "가격"),
      p("행 자리 표시자", "로드될 자산 행과 행동 공간을 미리 보여줍니다."),
    ],
    related: "loading",
  },
  DsPriceCell: {
    parts: [t("가격과 단위", "소비자 formatter로 값과 단위를 표현합니다.", "1,234,567원")],
    related: "assets",
  },
  DsSignedValue: {
    parts: [t("부호와 값", "방향을 부호로 전달하고 숫자 서식을 적용합니다.", "+2.35%")],
    related: "assets",
  },
};
