export default [
  ['DsAccordion', 'accordion', 'multiple', '첫 항목·둘째 항목의 펼침과 본문', {}],
  ['DsAccordionItem', 'accordion', 'title disabled', 'DsAccordion 안에서 항목 제목과 펼침 상태', { parent: 'DsAccordion' }],
  ['DsCard', 'action', 'title', '카드 푸터에 공급한 프로젝트 보기 버튼', { button: '프로젝트 보기', event: 'message', children: true }],
  ['DsDrawer', 'dialog', 'title closable closeOnEsc', '패널 열기 이후 초기 포커스·Tab 제한·닫기', { button: '패널 열기' }],
  ['DsModal', 'dialog', 'title closable closeOnEsc', '모달 열기 이후 초기 포커스·Tab 제한·닫기', { button: '모달 열기' }],
  ['DsPopover', 'dialog', 'ariaLabel focusOnOpen', '추가 정보 팝업의 이름·Escape·트리거 복귀', { button: '추가 정보' }],
  ['DsScrollFade', 'tab-order', '', '스크롤 영역에 공급한 12개 버튼의 Tab 순서', { children: true }],
  ['DsBottomActionBar', 'action', 'description', '하단 영역에 공급한 FormActions 확인·취소 버튼', { button: '변경 사항 저장', event: 'message', children: true }],
];
