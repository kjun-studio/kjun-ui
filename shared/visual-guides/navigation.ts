import { part as p, textPart as t, control as c, type GuideAuthor } from "./types.ts";
export const navigation: Record<string, GuideAuthor> = {
  DsBreadcrumb: {
    parts: [
      t("상위 위치", "상위 문서나 목록으로 돌아가는 경로입니다.", "홈"),
      t("현재 위치", "현재 보고 있는 위치를 표시합니다.", "현재 위치"),
    ],
    related: "assets",
  },
  DsExternalLink: {
    parts: [p("외부 링크", "이동할 대상과 외부 탐색 동작을 연결합니다.", 'a, [role="link"]')],
    related: "writing",
  },
  DsPagination: {
    parts: [
      p(
        "이전 이동",
        "이전 페이지로 이동합니다. 첫 페이지에서는 비활성입니다.",
        '[aria-label="이전 페이지"]',
      ),
      t("페이지 번호", "현재 페이지와 이동할 페이지를 구분합니다.", "1"),
    ],
    related: "assets",
  },
  DsTabs: {
    parts: [
      p("탭 목록", "44px 기본 높이로 전환할 영역을 나열합니다. compact는 32px입니다.", '[role="tablist"]'),
      c("개별 탭", "14px 라벨과 2px 선택선으로 현재 영역을 표시합니다. 선택 600, 미선택 500 굵기를 사용합니다.", "tab"),
      t("내용 영역", "현재 탭의 콘텐츠입니다. 밑줄형에서는 첫 탭과 왼쪽 시작선을 맞춥니다.", "첫 내용"),
    ],
    related: "assets",
  },
  DsTabPane: {
    parts: [
      t("탭 라벨", "부모 Tabs가 자식의 라벨로 탭을 만듭니다.", "첫 탭"),
      t("탭 내용", "선택한 TabPane의 콘텐츠입니다.", "첫 내용"),
    ],
    related: "assets",
  },
};
