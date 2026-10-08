import type { ExampleTools } from './example-tools';

export function renderMotionExample(name: string, tools: ExampleTools): any {
  const { h, get, set, button, feedback } = tools;
  switch (name) {
    case 'GuideMotionNumber':
      return h('Stack', {}, [
        h('DsAnimatedNumber', { value: get('number', 100), animated: true, fromPrevious: true, decimals: 0 }),
        h('Text', {}, '목표값: ' + get('number', 100)),
        h('Group', {}, [
          button('1000으로 변경', () => set('number', 1000)),
          button('120으로 변경', () => set('number', 120)),
        ]),
      ]);
    case 'GuideMotionToast':
      return h('Group', {}, [
        button('알림 3개 표시', () => {
          feedback.toast.clearAll();
          [1, 2, 3].forEach(index => {
            const id = feedback.toast.info('알림 ' + index, {
              duration: 0,
              ...(index === 2 ? { action: { label: '중간 알림 닫기', onClick: () => feedback.toast.dismiss(id) } } : {}),
            });
          });
        }),
        button('모두 닫기', () => feedback.toast.clearAll()),
      ]);
  }
}
