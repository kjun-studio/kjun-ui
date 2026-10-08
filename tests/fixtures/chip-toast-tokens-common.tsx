import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette } from './typography-values';

export const chipSizes = ['sm', 'md', 'lg'] as const;
export const toastMessage = '공통 토큰의 너비와 진행선을 확인하는 긴 알림 메시지입니다. '.repeat(4);

export function mountChipToastTokens(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [removed, setRemoved] = useState<string[]>([]), [actions, setActions] = useState(0);
    const feedback = api.useKjunFeedback();
    return h('div', { style: { padding: 16 } }, [
      ...chipSizes.map(size => h('div', { key: size, 'data-testid': `chip-${size}`, style: { display: 'flex', alignItems: 'flex-start' } },
        !removed.includes(size) && h(api.DsChip, { size, label: `칩 ${size}`, removable: true,
          removeLabel: `삭제 ${size}`, onRemove: () => setRemoved(old => [...old, size]) }))),
      h('div', { key: 'disabled', 'data-testid': 'disabled-chip', style: { display: 'flex', alignItems: 'flex-start' } }, h(api.DsChip, { label: '비활성 칩', removable: true,
        disabled: true, removeLabel: '비활성 삭제', onRemove: () => setActions(old => old + 100) })),
      h('button', { key: 'toast', onClick: () => feedback.toast.info(toastMessage, { title: '토큰 알림',
        duration: 60000, action: { label: '알림 실행', onClick: () => setActions(old => old + 1) } }) }, '알림 열기'),
      h('output', { key: 'removed', 'data-testid': 'removed' }, removed.join(',')),
      h('output', { key: 'actions', 'data-testid': 'actions' }, actions),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider,
    native ? { colors: palette(), fontFamily: 'sans-serif' } : null,
    h(api.KjunFeedbackProvider, null, h(Cases))));
}
