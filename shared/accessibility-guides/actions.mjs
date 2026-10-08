// Every public target is deliberately assigned a scenario; no catalog status implies a pass.
export default [
  ['DsButton', 'button', 'disabled loading ariaLabel', '계속하기 버튼의 Enter·Space 실행과 비활성·로딩 차단', { button: '계속하기', event: 'count' }],
  ['DsButtonGroup', 'choice', 'options disabled', '과일 보기의 선택 상태와 비활성 옵션', { role: 'button' }],
  ['DsCopyButton', 'action', 'value disabled', '복사 버튼과 프로젝트 복사 콜백', { event: 'message' }],
  ['DsDropdown', 'menu', 'disabled', '메뉴 열기와 첫 항목·비활성 항목·구분선', { button: '메뉴 열기' }],
  ['DsDropdownItem', 'menu', 'disabled', 'DsDropdown 안에서 첫 메뉴 항목 실행·선택과 닫기', { button: '메뉴 열기', parent: 'DsDropdown' }],
  ['DsDropdownDivider', 'divider', '', 'DsDropdown 안의 비대화형 메뉴 구분선', { button: '메뉴 열기', parent: 'DsDropdown' }],
  ['DsFormActions', 'action', 'confirmDisabled loading confirmText', '저장·취소 버튼과 확인 콜백', { button: '저장', event: 'message', disabledKey: 'disabled' }],
  ['DsIconToggle', 'toggle', 'active disabled ariaLabel', '좋아요 아이콘 버튼의 이름과 눌림 상태', {}],
  ['DsMenuButton', 'menu', 'disabled loading label', '작업 메뉴의 열기·항목 탐색·닫기', { button: '작업 메뉴' }],
  ['DsRefreshButton', 'action', 'disabled loading targetName', '목록 갱신 버튼과 갱신 콜백', { event: 'message' }],
  ['DsChip', 'remove', 'label removable disabled', '프로젝트 태그의 삭제 버튼', { button: '프로젝트 삭제' }],
];
