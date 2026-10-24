import { createApp, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as requests-cases.tsx (React/Native).
const layer = ref<'drawer' | 'modal' | null>(null);
const closes = ref<string[]>([]);
const afterClose = (name: string) => () => { closes.value = [...closes.value, name + (document.body.innerText.includes(name + ' body') ? ' visible' : ' gone')]; };
const reopen = () => { const name = layer.value; layer.value = null; setTimeout(() => { layer.value = name; }, 30); };
createApp(() => <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
  <div data-testid="after-close"><K.KjunProvider>
    <K.KjunButton onClick={() => { layer.value = 'drawer'; }}>open drawer</K.KjunButton>
    <K.KjunButton onClick={() => { layer.value = 'modal'; }}>open modal</K.KjunButton>
    <K.KjunText>{'closes: ' + (closes.value.join(', ') || 'none')}</K.KjunText>
    <K.KjunDrawer open={layer.value === 'drawer'} onUpdate:open={(v: boolean) => { if (!v) layer.value = null; }} title="Drawer" onAfterClose={afterClose('Drawer')}>
      <K.KjunText>Drawer body</K.KjunText>
      <K.KjunButton onClick={() => { layer.value = null; }}>close drawer</K.KjunButton>
      <K.KjunButton onClick={reopen}>reopen drawer</K.KjunButton>
    </K.KjunDrawer>
    <K.KjunModal open={layer.value === 'modal'} onUpdate:open={(v: boolean) => { if (!v) layer.value = null; }} title="Modal" onAfterClose={afterClose('Modal')}>
      <K.KjunText>Modal body</K.KjunText>
      <K.KjunButton onClick={() => { layer.value = null; }}>close modal</K.KjunButton>
      <K.KjunButton onClick={reopen}>reopen modal</K.KjunButton>
    </K.KjunModal>
  </K.KjunProvider></div>
  <div data-testid="rows"><K.KjunProvider>
    <K.KjunListSection ariaLabel="Spending">
      <K.KjunListRow title="Coffee" description="Today" ariaLabel="Coffee, today, minus 4,500 won" onClick={() => {}}>
        {{ default: () => <K.KjunProgress value={60} label="Budget" />, trailing: () => <K.KjunText>-4,500</K.KjunText> }}
      </K.KjunListRow>
    </K.KjunListSection>
  </K.KjunProvider></div>
  <div data-testid="text-props"><K.KjunProvider>
    <K.KjunText aria-label="Balance 1,000 won" data-testid="balance">1,000</K.KjunText>
  </K.KjunProvider></div>
</div>).mount('#root');
