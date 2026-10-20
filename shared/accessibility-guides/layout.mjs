export default [
  ['KjunAccordion', 'accordion', 'multiple', '첫 항목·둘째 항목의 펼침과 본문', {}],
  ['KjunAccordionItem', 'accordion', 'title disabled', 'KjunAccordion 안에서 항목 제목과 펼침 상태', { parent: 'KjunAccordion' }],
  ['KjunCard', 'action', 'title', '카드 푸터에 공급한 프로젝트 보기 버튼', { button: '프로젝트 보기', event: 'message', children: true }],
  ['KjunDrawer', 'dialog', 'title closable closeOnEsc', '패널 열기 이후 초기 포커스·Tab 제한·닫기', { button: '패널 열기' }],
  ['KjunModal', 'dialog', 'title closable closeOnEsc', '모달 열기 이후 초기 포커스·Tab 제한·닫기', { button: '모달 열기' }],
  ['KjunPopover', 'dialog', 'ariaLabel focusOnOpen', '추가 정보 팝업의 이름·Escape·트리거 복귀', { button: '추가 정보' }],
  ['KjunScrollFade', 'tab-order', '', '스크롤 영역에 공급한 12개 버튼의 Tab 순서', { children: true }],
  ['KjunText', 'text', 'variant', '섹션 제목과 보조 설명 문구', {}],
  ['KjunStack', 'text', 'gap', '세로로 쌓은 제목·설명·저장 버튼', { children: true }],
  ['KjunInline', 'text', 'gap', '가로로 놓은 취소·저장 버튼', { children: true }],
  ['KjunBottomActionBar', 'action', 'description', '하단 영역에 공급한 FormActions 확인·취소 버튼', { button: '변경 사항 저장', event: 'message', children: true }],
];
