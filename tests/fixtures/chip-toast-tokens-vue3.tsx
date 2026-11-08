import { createApp, defineComponent, reactive, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { cssPalette } from './typography-values';
const chipSizes = ['sm', 'md', 'lg'] as const;
const toastMessage = '공통 토큰의 너비와 줄바꿈을 확인하는 긴 알림 메시지입니다. '.repeat(4);
cssPalette();
const Cases = defineComponent(() => {
  const s = reactive({ removed: [] as string[], actions: 0, removeArgs: [] as number[] });
  const feedback = K.useKjunFeedback();
  const chip = ref<{ focus(): void } | null>(null);
  return () => <div style={{ padding: '16px' }}>
    {chipSizes.map(size => <div key={size} data-testid={`chip-${size}`} style={{ display: 'flex', alignItems: 'flex-start' }}>
      {!s.removed.includes(size) && <K.KjunChip size={size} label={`칩 ${size}`} removable removeLabel={`삭제 ${size}`} onRemove={(...args: unknown[]) => { s.removeArgs.push(args.length); s.removed.push(size); }} />}
    </div>)}
    <div data-testid="disabled-chip" style={{ display: 'flex', alignItems: 'flex-start' }}>
      <K.KjunChip label="비활성 칩" removable disabled removeLabel="비활성 삭제" onRemove={() => s.actions += 100} />
    </div>
    <div data-testid="chip-long" style={{ display: 'flex', alignItems: 'flex-start', width: '220px' }}><K.KjunChip label="아주 긴 라벨이 들어가도 칩은 한 줄을 지키고 말줄임으로 끝납니다" removable removeLabel="긴 칩 삭제" id="chip-long-root" class="consumer-chip" data-testid="chip-attrs" style={{ marginTop: '4px' }} ref={chip} /></div>
    <div data-testid="chip-xl" style={{ display: 'flex', alignItems: 'flex-start' }}><K.KjunChip size={'xl' as 'md'} label="칩 xl" removable removeLabel="삭제 xl" /></div>
    <button onClick={() => chip.value?.focus()}>칩 삭제로 이동</button>
    <button onClick={() => feedback.toast.info(toastMessage, { title: '토큰 알림', duration: 60000, action: { label: '알림 실행', onClick: () => s.actions++ } })}>알림 열기</button>
    <button onClick={() => feedback.toast.success('짧은 알림', { compact: true, duration: 60000 })}>짧은 알림 열기</button>
    <button onClick={() => feedback.toast.error('남는 오류')}>오류 알림 열기</button>
    <output data-testid="removed">{s.removed.join(',')}</output>
    <output data-testid="actions">{s.actions}</output>
    <output data-testid="remove-args">{s.removeArgs.join(',')}</output>
  </div>;
});
createApp(defineComponent(() => () => <K.KjunProvider><K.KjunFeedbackProvider><Cases /></K.KjunFeedbackProvider></K.KjunProvider>)).mount('#root');
