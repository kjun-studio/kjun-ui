import { createApp, defineComponent, onMounted } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
cssPalette();
const Cases = defineComponent(() => {
  const feedback = K.useKjunFeedback();
  onMounted(() => {
    (window as any).feedback = feedback;
    feedback.toast.error('네트워크 연결을 확인한 뒤 다시 시도하세요.', { title: '파일을 올리지 못했습니다' });
    feedback.toast.info('새 버전이 있습니다', { duration: 0, action: { label: '새로고침', onClick: () => {} } });
    feedback.toast.success('저장했습니다', { duration: 0 });
    feedback.toast.success('링크를 복사했습니다', { compact: true, duration: 0 });
    feedback.toast.warning('저장 공간이 거의 찼습니다', { duration: 0 });
  });
  return () => <div style={{ padding: '16px', height: '700px', background: '#f4f4f5' }}>page</div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Cases /></K.KjunFeedbackProvider></K.KjunProvider>)).mount('#root');
