import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const options = [{ label: '전체', value: 'all' }, { label: '진행 중', value: 'open' }];
const Page = defineComponent({ setup() {
  const filter = ref('all'), name = ref('');
  return () => <main style={{ padding: '24px', width: '480px' }}>
    <style>{'.app-slot { margin-top: 13px; grid-column: span 2; }'}</style>
    <K.KjunFormGroup label="이름" class="app-slot"><K.KjunInput modelValue={name.value} onUpdate:modelValue={(next: string) => { name.value = next; }} /></K.KjunFormGroup>
    <K.KjunFilterGroup class="app-slot" ariaLabel="상태" modelValue={filter.value} options={options} onUpdate:modelValue={(next: unknown) => { filter.value = String(next); }} />
    <K.KjunAlert class="app-slot" title="알림" closable>닫으면 클래스도 함께 사라집니다.</K.KjunAlert>
    <K.KjunCard class="app-slot" title="카드">본문</K.KjunCard>
  </main>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
