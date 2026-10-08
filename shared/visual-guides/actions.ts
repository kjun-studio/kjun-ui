import { part as p, textPart as t, control as c, visual, type GuideAuthor } from "./types.ts";
export const actions: Record<string, GuideAuthor> = {
  DsButton: {
    settings: visual("DsButton", { prefixIcon: "plus" }),
    parts: [
      c("컨트롤", "행동의 중요도와 클릭 범위를 표시합니다."),
      t("라벨", "실행할 행동을 짧은 동사로 설명합니다.", "계속하기"),
      p(
        "보조 아이콘",
        "행동을 보조하는 아이콘입니다. 라벨의 의미를 대신하지 않습니다.",
        "svg",
        true,
      ),
    ],
    states: [
      { id: "button-sizes", label: "크기를 나란히 비교", description: "크기별 높이와 모서리를 함께 비교합니다. 수치는 기본 규격 표에서 확인하세요.", settings: { comparison: "크기" } },
      { id: "button-variants", label: "강조와 의미 비교", description: "같은 형태에서 채움·테두리·색상 역할을 비교합니다.", settings: { comparison: "변형" } },
      { id: "button-labels", label: "라벨·아이콘 비교", description: "한글·영문과 아이콘 배치를 내용 너비로 확인합니다.", settings: { comparison: "라벨·아이콘" } },
      { id: "button-states", label: "기본·로딩·비활성 비교", description: "텍스트 전용 버튼은 라벨의 공간을 보존하고 중앙에 스피너를 표시합니다.", settings: { comparison: "상태" } },
      { id: "button-block", label: "전체 너비 · 375px", description: "좁은 화면에서 lg 크기의 높이와 모서리를 확인합니다.", settings: { size: "lg", block: true }, viewportWidth: 375 },
    ],
    related: "writing",
  },
  DsButtonGroup: {
    parts: [
      c("선택 항목", "같은 목적의 선택지를 묶습니다."),
      t("항목 라벨", "선택 후 적용될 기준을 설명합니다.", "사과"),
    ],
    related: "toolbar",
  },
  DsCopyButton: {
    parts: [
      c("복사 컨트롤", "소비자가 제공한 값을 복사합니다."),
      t("복사 라벨", "복사 동작과 완료 결과를 표시합니다.", "복사"),
    ],
    related: "toolbar",
  },
  DsDropdown: {
    action: "메뉴 열기",
    parts: [
      t("트리거", "메뉴를 여는 버튼입니다.", "메뉴 열기"),
      c("메뉴 항목", "열린 메뉴의 개별 행동입니다.", "menuitem"),
    ],
    related: "layers",
  },
  DsDropdownDivider: {
    action: "메뉴 열기",
    parts: [
      p(
        "구분선",
        "부모 메뉴 안에서 행동 묶음의 경계를 표시합니다. 독립적인 행동이나 라벨이 아닙니다.",
        '.kjun-dropdown-divider, [role="menu"] > [style*="--extension-menu-divider-height"], [role="menuitem"] + [style*="height: 1px"], [role="separator"]',
      ),
    ],
    related: "layers",
  },
  DsDropdownItem: {
    action: "메뉴 열기",
    parts: [
      c("항목 컨트롤", "부모 Dropdown 안의 행동과 선택·비활성 표현을 담당합니다.", "menuitem"),
      t("행동 라벨", "누르면 실행할 동작을 설명합니다.", "첫 항목"),
    ],
    related: "layers",
  },
  DsFormActions: {
    parts: [
      t("보조 행동", "입력을 취소하거나 이전 단계로 돌아갑니다.", "취소"),
      t("주요 행동", "폼을 검증하고 저장하는 소비자 콜백에 연결합니다.", "저장"),
    ],
    states: [
      { id: 'form-actions-md', label: '밀도 높은 폼', description: 'md는 최소 40px 높이로 주변 입력과 밀도를 맞춥니다.', settings: { size: 'md' } },
      { id: 'form-actions-stacked', label: '좁은 폭', description: '두 버튼이 들어가지 않으면 취소 → 확인 순서로 전체 너비를 채웁니다.', settings: { exampleWidth: '200', confirmText: '변경 사항 저장' } },
      { id: 'form-actions-long', label: '긴 확인 문구', description: '영역을 넘는 문구는 줄바꿈하고 버튼 높이를 늘립니다.', settings: { exampleWidth: '288', cancelText: 'Cancel', confirmText: 'Save changes and continue to next step' } },
    ],
    related: "form",
  },
  DsIconToggle: {
    parts: [c("토글 컨트롤", "아이콘의 선택 상태와 접근성 이름으로 의미를 전달합니다.")],
    states: [
      { id: "favorite", label: "즐겨찾기", description: "별 아이콘과 프로젝트의 즐겨찾기 색상·문구를 연결합니다.", settings: { usage: "즐겨찾기" } },
      { id: "interest", label: "관심", description: "하트 아이콘과 프로젝트의 관심 색상·문구를 연결합니다.", settings: { usage: "관심" } },
    ],
    related: "toolbar",
  },
  DsMenuButton: {
    action: "작업 메뉴",
    parts: [
      t("메뉴 트리거", "관련 행동이 있는 메뉴를 엽니다.", "작업 메뉴"),
      c("작업 항목", "메뉴 안에서 실제 행동을 선택합니다.", "menuitem"),
    ],
    states: [
      { id: "menu-compact", label: "아이콘 전용", description: "라벨을 접근성 이름으로 유지하는 정사각형 더보기 버튼입니다.", settings: { compact: true }, action: "작업 메뉴" },
      { id: "menu-ghost", label: "낮은 강조", description: "ghost도 메뉴가 열린 동안 배경과 위쪽 화살표로 활성 상태를 유지합니다.", settings: { variant: "ghost" }, action: "작업 메뉴" },
    ],
    related: "toolbar",
  },
  DsRefreshButton: {
    parts: [
      c("갱신 컨트롤", "새로고침 요청과 진행 상태를 표시합니다. 실제 요청은 소비자가 수행합니다."),
    ],
    states: [
      { id: "refresh-text", label: "아이콘과 라벨", description: "텍스트형에도 새로고침 아이콘을 표시하며, 로딩 중 라벨과 너비를 유지합니다.", settings: { mode: "text" } },
      { id: "refresh-loading", label: "갱신 중", description: "일반 설정에서는 아이콘이 회전하고, 모션 감소 설정에서는 정적 로더로 진행 상태를 구분합니다.", settings: { mode: "text", loading: true } },
      { id: "refresh-toolbar", label: "일반 버튼과 함께", description: "기본 sm은 작은 툴바에 사용하고, 40px Button 옆에서는 md로 높이를 맞춥니다.", settings: { mode: "text", size: "md" } },
    ],
    related: "loading",
  },
};
