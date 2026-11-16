import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';

applyDemoColors('default');
const Page = defineComponent({ setup() {
  const presses = ref(0), press = () => { presses.value++; };
  return () => <div style={{ padding: '24px', width: '360px', display: 'grid', gap: '16px' }}>
    <K.KjunPressable ariaLabel="추억 지도에서 보기" onClick={press} style={{ borderRadius: '16px', overflow: 'hidden' }}><div data-testid="map" style={{ height: '120px', background: '#CFE4F7' }} /></K.KjunPressable>
    <K.KjunPressable onClick={press} pressEffect="none" style={{ padding: '12px' }}>표시 없는 영역</K.KjunPressable>
    <K.KjunPressable ariaLabel="잠긴 영역" onClick={press} disabled style={{ padding: '12px' }}>잠긴 영역</K.KjunPressable>
    <K.KjunPressable ariaLabel="꽉 찬 영역" onClick={press} focusRingInset style={{ padding: '12px' }}>꽉 찬 영역</K.KjunPressable>
    <div data-testid="presses">{presses.value}</div>
  </div>;
} });
createApp(() => <K.KjunProvider><Page /></K.KjunProvider>).mount('#root');
