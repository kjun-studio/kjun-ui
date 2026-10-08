export default [
  ['DsBreadcrumb', 'link', 'items', '홈·목록 링크와 현재 위치', { hash: '#home' }],
  ['DsExternalLink', 'link', 'href label', '외부 페이지 링크의 이름과 실행', { external: true }],
  ['DsPagination', 'pagination', 'currentPage totalPages showSizeSelector', '다음 페이지 버튼과 현재 페이지 표시', {}],
  ['DsTabs', 'tabs', 'value', '첫 탭·둘째 탭·비활성 탭과 연결된 패널', {}],
  ['DsTabPane', 'tabs', 'name label disabled', 'DsTabs 안에서 선택된 패널만 노출되는 조건', { parent: 'DsTabs' }],
  ['DsTopNavigation', 'action', 'title', '상단 탐색에 공급한 뒤로 가기·저장 버튼', { button: '저장', event: 'message', children: true }],
  ['DsBottomNavigation', 'bottom-nav', 'items value ariaLabel', '주요 탐색의 홈·활동·설정 목적지와 현재 위치', {}],
];
