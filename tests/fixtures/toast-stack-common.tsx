import { createElement as h, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette } from './typography-values';
export function mountToastStack(api: any, native: boolean) {
  cssPalette();
  function Cases() {
    const feedback = api.useKjunFeedback();
    useEffect(() => {
      (window as any).feedback = feedback;
      feedback.toast.error('네트워크 연결을 확인한 뒤 다시 시도하세요.', { title: '파일을 올리지 못했습니다' });
      feedback.toast.info('새 버전이 있습니다', { duration: 0, action: { label: '새로고침', onClick: () => {} } });
      feedback.toast.success('저장했습니다', { duration: 0 });
      feedback.toast.success('링크를 복사했습니다', { compact: true, duration: 0 });
      feedback.toast.warning('저장 공간이 거의 찼습니다', { duration: 0 });
    }, []);
    return h('div', { style: { padding: 16, height: 700, background: '#f4f4f5' } }, 'page');
  }
  createRoot(document.getElementById('root')!).render(h(api.KjunProvider, native ? { colors: palette(), fontFamily: 'sans-serif' } : null, h(api.KjunFeedbackProvider, null, h(Cases))));
}
