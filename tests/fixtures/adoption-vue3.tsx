import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as adoption-cases.tsx (React/Native).
const feedback = K.createKjunFeedback();
const presses = ref(0);
function openFromFunction() { void feedback.confirm({ message: 'Opened from a function' }); feedback.toast.info('Toast from a function', { duration: 0 }); }
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="external-feedback"><K.KjunProvider><K.KjunFeedbackProvider controller={feedback}>
    <K.KjunButton onClick={openFromFunction}>open from function</K.KjunButton>
  </K.KjunFeedbackProvider></K.KjunProvider></div>
  <div data-testid="cards"><K.KjunProvider>
    <K.KjunCard pressable title="Question card" onClick={() => { presses.value++; }}><K.KjunText>Today's question</K.KjunText></K.KjunCard>
    <K.KjunCard title="Plain card" onClick={() => {}}><K.KjunText>Plain body</K.KjunText></K.KjunCard>
    <K.KjunCard pressable disabled title="Disabled card" onClick={() => { presses.value++; }}><K.KjunText>Disabled body</K.KjunText></K.KjunCard>
    <K.KjunText>{'presses ' + presses.value}</K.KjunText>
  </K.KjunProvider></div>
</div>).mount('#root');
