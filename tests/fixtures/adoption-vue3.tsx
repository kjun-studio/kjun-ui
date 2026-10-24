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
  <div data-testid="tones"><K.KjunProvider>
    {['brand', 'danger', 'success', 'warning', 'inverse'].map(tone => <K.KjunText key={tone} tone={tone as any}>{'tone ' + tone}</K.KjunText>)}
  </K.KjunProvider></div>
  <div data-testid="settings-list"><K.KjunProvider>
    <K.KjunListSection ariaLabel="Settings" surface={false}>
      <K.KjunListRow title="Profile" chevron onClick={() => {}} />
      <K.KjunListItem><K.KjunText>Theme switcher</K.KjunText></K.KjunListItem>
      <K.KjunListRow title="Delete account" destructive onClick={() => {}} />
    </K.KjunListSection>
  </K.KjunProvider></div>
  <div data-testid="avatars"><K.KjunProvider>
    <K.KjunAvatar name="Kim" color="rgb(10, 20, 30)" textColor="rgb(250, 240, 230)" />
    <K.KjunAvatar color="rgb(10, 20, 30)" textColor="rgb(250, 240, 230)" />
  </K.KjunProvider></div>
  <div data-testid="circle-progress"><K.KjunProvider>
    <K.KjunProgress shape="circle" value={40} showLabel label="Weekly goal" subLabel="4 of 10" />
    <K.KjunProgress shape="circle" size="sm" value={70} showLabel label="Small goal" />
  </K.KjunProvider></div>
</div>).mount('#root');
