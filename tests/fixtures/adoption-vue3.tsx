import { createApp } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as adoption-cases.tsx (React/Native).
const feedback = K.createKjunFeedback();
function openFromFunction() { void feedback.confirm({ message: 'Opened from a function' }); feedback.toast.info('Toast from a function', { duration: 0 }); }
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="external-feedback"><K.KjunProvider><K.KjunFeedbackProvider controller={feedback}>
    <K.KjunButton onClick={openFromFunction}>open from function</K.KjunButton>
  </K.KjunFeedbackProvider></K.KjunProvider></div>
</div>).mount('#root');
