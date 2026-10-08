import type { ExampleTools } from './example-tools';
export function renderInteractionExample(name: string, tools: ExampleTools): any {
  const { h, get, set, change, action } = tools;
  switch (name) {
    case 'GuideInteractionTabs':
      return h('Stack', {}, [
        h('DsTabs', { ariaLabel: '상태 비교', value: get('tab', 'one'), onValueChange: change('tab') }, [
          h('DsTabPane', { name: 'one', label: '첫 탭', disabled: get('firstDisabled', false) }, '첫 내용'),
          h('DsTabPane', { name: 'two', label: '둘째 탭' }, '둘째 내용'),
          h('DsTabPane', { name: 'blocked', label: '비활성 탭', disabled: true }, '비활성 내용'),
        ]),
        h('Text', {}, '선택값: ' + get('tab', 'one')),
        h('Group', {}, [h('DsButton', { variant: 'secondary', size: 'sm', ...action(() => set('firstDisabled', !get('firstDisabled', false))) }, get('firstDisabled', false) ? '첫 탭 활성화' : '첫 탭 비활성화')]),
      ]);
    case 'GuideInteractionInput':
      return h('Stack', {}, [
        h('DsFormGroup', { label: '일반 입력' }, h('DsInput', { value: get('normal', '장기 보유 자산'), onValueChange: change('normal'), clearable: true })),
        h('DsFormGroup', { label: '읽기 전용 입력' }, h('DsInput', { value: get('readonly', '장기 보유 자산'), onValueChange: change('readonly'), clearable: true, readOnly: true })),
        h('DsFormGroup', { label: '비활성 입력' }, h('DsInput', { value: get('blocked', '장기 보유 자산'), onValueChange: change('blocked'), clearable: true, disabled: true })),
        h('Group', {}, [h('DsButton', { variant: 'secondary', size: 'sm', ...action(() => {
          const next = get('updated', false) ? '장기 보유 자산' : '새 목록';
          set('normal', next); set('readonly', next); set('blocked', next); set('updated', !get('updated', false));
        }) }, '프로젝트에서 값 갱신')]),
      ]);
    case 'GuideInteractionLoading': {
      let result: { focus?: () => void; announce?: (message: string) => void } | null = null;
      const resultText = (phase: string) => phase === 'success' ? '저장했습니다.' : phase === 'error' ? '저장하지 못했습니다. 다시 시도하세요.' : phase === 'pending' ? '완료 또는 실패를 선택하세요.' : '저장을 눌러 시작하세요.';
      const transition = (phase: string) => {
        result?.focus?.();
        set('phase', phase);
        result?.announce?.(resultText(phase));
      };
      const finish = (phase: string) => { if (get('phase', 'idle') === 'pending') transition(phase); };
      return h('Stack', {}, [
        h('Group', {}, [
          h('DsButton', { loading: get('phase', 'idle') === 'pending', disabled: get('blocked', false), ...action(() => {
            transition('pending'); set('count', get('count', 0) + 1);
          }) }, '저장'),
        ]),
        h('Text', {}, '실행 횟수: ' + get('count', 0)),
        h('Status', { ref: (node: typeof result) => { result = node; } }, resultText(get('phase', 'idle'))),
        h('Group', {}, [
          h('DsButton', { variant: 'secondary', disabled: get('phase', 'idle') !== 'pending', ...action(() => finish('success')) }, '완료로 처리'),
          h('DsButton', { variant: 'secondary', disabled: get('phase', 'idle') !== 'pending', ...action(() => finish('error')) }, '실패로 처리'),
        ]),
        h('Group', {}, [h('DsButton', { variant: 'secondary', size: 'sm', ...action(() => set('blocked', !get('blocked', false))) }, get('blocked', false) ? '저장 활성화' : '저장 비활성화')]),
      ]);
    }
  }
}
