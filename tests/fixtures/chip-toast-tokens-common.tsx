import { createElement as h, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette } from './typography-values';

export const chipSizes = ['sm', 'md', 'lg'] as const;
export const toastMessage = '공통 토큰의 너비와 줄바꿈을 확인하는 긴 알림 메시지입니다. '.repeat(4);

export function mountChipToastTokens(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [removed, setRemoved] = useState<string[]>([]), [actions, setActions] = useState(0), [removeArgs, setRemoveArgs] = useState<number[]>([]);
    const feedback = api.useKjunFeedback();
    const chipRef = useRef<{ focus(): void } | null>(null);
    return h('div', { style: { padding: 16 } }, [
      ...chipSizes.map(size => h('div', { key: size, 'data-testid': `chip-${size}`, style: { display: 'flex', alignItems: 'flex-start' } },
        !removed.includes(size) && h(api.KjunChip, { size, label: `칩 ${size}`, removable: true,
          removeLabel: `삭제 ${size}`, onRemove: (...args: unknown[]) => { setRemoveArgs(old => [...old, args.length]); setRemoved(old => [...old, size]); } }))),
      h('div', { key: 'disabled', 'data-testid': 'disabled-chip', style: { display: 'flex', alignItems: 'flex-start' } }, h(api.KjunChip, { label: '비활성 칩', removable: true,
        disabled: true, removeLabel: '비활성 삭제', onRemove: () => setActions(old => old + 100) })),
      h('div', { key: 'long', 'data-testid': 'chip-long', style: { display: 'flex', alignItems: 'flex-start', width: 220 } }, h(api.KjunChip, { ref: chipRef, label: '아주 긴 라벨이 들어가도 칩은 한 줄을 지키고 말줄임으로 끝납니다', removable: true, removeLabel: '긴 칩 삭제', style: { marginTop: 4 },
        // Web chips pass the consumer's own attributes to their root; Native takes testID and style like Badge.
        ...(native ? { testID: 'chip-attrs' } : { id: 'chip-long-root', className: 'consumer-chip', 'data-testid': 'chip-attrs' }) })),
      // Untyped callers may pass a size the chip does not have; it draws as md.
      h('div', { key: 'xl', 'data-testid': 'chip-xl', style: { display: 'flex', alignItems: 'flex-start' } }, h(api.KjunChip, { size: 'xl', label: '칩 xl', removable: true, removeLabel: '삭제 xl' })),
      h('button', { key: 'focus', onClick: () => chipRef.current?.focus() }, '칩 삭제로 이동'),
      h('button', { key: 'toast', onClick: () => feedback.toast.info(toastMessage, { title: '토큰 알림',
        duration: 60000, action: { label: '알림 실행', onClick: () => setActions(old => old + 1) } }) }, '알림 열기'),
      h('button', { key: 'compact', onClick: () => feedback.toast.success('짧은 알림', { compact: true, duration: 60000 }) }, '짧은 알림 열기'),
      h('button', { key: 'error', onClick: () => feedback.toast.error('남는 오류') }, '오류 알림 열기'),
      h('output', { key: 'removed', 'data-testid': 'removed' }, removed.join(',')),
      h('output', { key: 'actions', 'data-testid': 'actions' }, actions),
      h('output', { key: 'remove-args', 'data-testid': 'remove-args' }, removeArgs.join(',')),
    ]);
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider,
    native ? { colors: palette(), fontFamily: 'sans-serif' } : null,
    h(api.KjunFeedbackProvider, null, h(Cases))));
}
