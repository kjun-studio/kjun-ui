import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const open = ref(false), plain = ref(true), presses = ref(0);
  return () => <div style={{ padding: '24px', width: '380px' }}>
    <K.KjunListSection title="자산">
      <K.KjunListRow title="현재 잔액" description="11월 16일 기준" icon="wallet" expanded={open.value} onUpdate:expanded={(next: boolean) => { open.value = next; }}>{{
        trailing: () => '1,730,000원',
        expanded: () => <div data-testid="breakdown"><div>지난달 이월 520,000원</div><K.KjunButton size="sm" variant="secondary" onClick={() => { presses.value++; }}>계산 방식 보기</K.KjunButton></div>,
      }}</K.KjunListRow>
      <K.KjunListRow title="이번 달 수입" icon="arrow-up-right">{{ trailing: () => '3,350,000원' }}</K.KjunListRow>
      <K.KjunListRow title="아이콘 없는 행" expanded={plain.value} onUpdate:expanded={(next: boolean) => { plain.value = next; }}>{{ expanded: () => <div data-testid="plain">펼친 내용</div> }}</K.KjunListRow>
      <K.KjunListRow title="잠긴 행" disabled expanded={false}>{{ expanded: () => '잠긴 내용' }}</K.KjunListRow>
    </K.KjunListSection>
    <div data-testid="presses">{presses.value}</div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
