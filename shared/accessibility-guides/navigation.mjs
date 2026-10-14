export default [
  ['KjunBreadcrumb', 'link', 'items', '홈·목록 링크와 현재 위치', { hash: '#home' }],
  ['KjunExternalLink', 'link', 'href label', '외부 페이지 링크의 이름과 실행', { external: true }],
  ['KjunPagination', 'pagination', 'currentPage totalPages showSizeSelector', '다음 페이지 버튼과 현재 페이지 표시', {}],
  ['KjunTabs', 'tabs', 'value', '첫 탭·둘째 탭·비활성 탭과 연결된 패널', {}],
  ['KjunTabPane', 'tabs', 'name label disabled', 'KjunTabs 안에서 선택된 패널만 노출되는 조건', { parent: 'KjunTabs' }],
  ['KjunTopNavigation', 'action', 'title', '상단 탐색에 공급한 뒤로 가기·저장 버튼', { button: '저장', event: 'message', children: true }],
  ['KjunBottomNavigation', 'bottom-nav', 'items value ariaLabel', '주요 탐색의 홈·활동·설정 목적지와 현재 위치', {}],
];
