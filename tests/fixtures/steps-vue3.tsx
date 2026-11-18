import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as steps-cases.tsx (React/Native).
const wizard = ['약관 동의', '주문자 정보', '배송 정보', '결제', '완료'].map(label => ({ label }));
const checkout = ['약관 동의', '배송 정보', '결제', '완료'].map(label => ({ label }));
const tracking = [
  { label: '주문 접수', meta: '10:02', description: '판매자가 주문을 확인했습니다' },
  { label: '상품 준비', meta: '11:30', description: '포장을 마쳤습니다' },
  { label: '배송 중', meta: '14:05', description: '서울 강남 허브를 지났습니다' },
  { label: '배송 완료', meta: '', description: '문 앞에 놓아 두었습니다' },
];
const long = ['배송지 입력 및 확인', 'Supercalifragilistic', '결제', '완료'].map(label => ({ label }));
const App = defineComponent(() => {
  const selected = ref<number | null>(null), verticalSelected = ref<number | null>(null), bareSelected = ref<number | null>(null), skipped = ref<number | null>(null), width = ref(900);
  const block = { width: '900px' };
  return () => <K.KjunProvider>{{ default: () => <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '16px' }}>
    <div data-testid="wizard" style={block}><K.KjunSteps items={wizard} current={2} ariaLabel="주문 단계" /></div>
    <div data-testid="error" style={block}><K.KjunSteps items={checkout} current={2} currentStatus="error" /></div>
    <div data-testid="done" style={block}><K.KjunSteps items={checkout.slice(0, 3)} current={3} currentStatus="error" /></div>
    <div data-testid="vertical" style={{ width: '360px' }}><K.KjunSteps items={tracking} current={2} orientation="vertical" ariaLabel="배송 추적" /></div>
    <div data-testid="vselect" style={{ width: '360px' }}><K.KjunSteps items={tracking} current={2} orientation="vertical" onStepSelect={(i: number) => { verticalSelected.value = i; }} /></div>
    <output data-testid="vselected">{verticalSelected.value === null ? '' : verticalSelected.value}</output>
    <div data-testid="vbare" style={{ width: '360px' }}><K.KjunSteps items={['A', 'B', 'C'].map(label => ({ label }))} current={2} orientation="vertical" onStepSelect={(i: number) => { bareSelected.value = i; }} /></div>
    <output data-testid="vbareselected">{bareSelected.value === null ? '' : bareSelected.value}</output>
    <div data-testid="many" style={{ width: '2000px' }}><K.KjunSteps items={Array.from({ length: 11 }, (_, i) => ({ label: `단계 ${i + 1}` }))} current={4} /></div>
    <div data-testid="full" style={{ width: '300px' }}><K.KjunSteps items={wizard} current={2} layout="full" /></div>
    <div data-testid="long" style={{ width: '360px' }}><K.KjunSteps items={long} current={1} /></div>
    <div data-testid="forced" style={{ width: '1000px' }}><K.KjunSteps items={wizard} current={2} layout="compact" /></div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <div data-testid="narrow"><K.KjunButton variant="secondary" onClick={() => { width.value = 360; }}>Narrow</K.KjunButton></div>
      <div data-testid="wide"><K.KjunButton variant="secondary" onClick={() => { width.value = 900; }}>Wide</K.KjunButton></div>
    </div>
    <div data-testid="width" style={{ width: width.value + 'px' }}>
      <div data-testid="fit"><K.KjunSteps items={wizard} current={2} /></div>
      <div data-testid="select" style={{ marginTop: '32px' }}><K.KjunSteps items={wizard} current={3} ariaLabel="이동 가능한 단계" onStepSelect={(i: number) => { selected.value = i; }} /></div>
    </div>
    <output data-testid="selected">{selected.value === null ? '' : selected.value}</output>
    <div data-testid="skip" style={block}><K.KjunSteps items={wizard} current={2} selectable="all" onStepSelect={(i: number) => { skipped.value = i; }} /></div>
    <output data-testid="skipped">{skipped.value === null ? '' : skipped.value}</output>
  </div> }}</K.KjunProvider>;
});
createApp(App).mount('#root');
