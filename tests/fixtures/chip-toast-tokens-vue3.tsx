import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
const chipSizes = ['sm', 'md', 'lg'] as const;
const toastMessage = '공통 토큰의 너비와 진행선을 확인하는 긴 알림 메시지입니다. '.repeat(4);
cssPalette();
const Cases = defineComponent(() => {
  const s = reactive({ removed: [] as string[], actions: 0 });
  const feedback = K.useKjunFeedback();
  return () => <div style={{ padding: '16px' }}>
    {chipSizes.map(size => <div key={size} data-testid={`chip-${size}`} style={{ display: 'flex', alignItems: 'flex-start' }}>
      {!s.removed.includes(size) && <K.KjunChip size={size} label={`칩 ${size}`} removable removeLabel={`삭제 ${size}`} onRemove={() => s.removed.push(size)} />}
    </div>)}
    <div data-testid="disabled-chip" style={{ display: 'flex', alignItems: 'flex-start' }}>
      <K.KjunChip label="비활성 칩" removable disabled removeLabel="비활성 삭제" onRemove={() => s.actions += 100} />
    </div>
    <button onClick={() => feedback.toast.info(toastMessage, { title: '토큰 알림', duration: 60000, action: { label: '알림 실행', onClick: () => s.actions++ } })}>알림 열기</button>
    <output data-testid="removed">{s.removed.join(',')}</output>
    <output data-testid="actions">{s.actions}</output>
  </div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Cases /></K.KjunFeedbackProvider></K.KjunProvider>)).mount('#root');
