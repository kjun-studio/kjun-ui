import type { ExampleTools } from './example-tools';
export function renderAccessibilityExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, button, action } = tools;
  switch (name) {
    case 'GuideAccessibleForm':
      return h('Stack', {}, [
        h('DsFormGroup', {
          label: '목록 이름', hint: '동료가 구분할 수 있는 이름을 입력하세요.',
          error: get('invalid', false) ? '목록 이름을 입력해 주세요. 다른 목록과 구분할 수 있는 이름이 필요합니다.' : '',
        }, h('DsInput', { value: get('listName', ''), onValueChange: change('listName'), error: get('invalid', false), placeholder: '예: 장기 보유 자산' })),
        h('DsFormGroup', { label: '담당자', hint: '목록을 함께 관리할 담당자를 입력하세요.' },
          h('DsInput', { value: get('owner', ''), onValueChange: change('owner'), placeholder: '예: 김서연' })),
        h('Group', {}, [
          button(get('invalid', false) ? '오류 해제' : '오류 표시', () => set('invalid', !get('invalid', false))),
          h('DsButton', { prefixIcon: 'search', ariaLabel: '목록 검색', ...action(() => set('result', '검색 실행: ' + (get('listName', '') || '전체 목록'))) }),
        ]),
        h('Text', {}, get('result', '아직 검색하지 않았습니다.')),
      ]);
  }
}
