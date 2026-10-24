import { createApp, defineComponent, ref } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors } from '../../shared/demo-colors';
applyDemoColors('default');
// Same sections and DOM as requests-cases.tsx (React/Native).
const layer = ref<'drawer' | 'modal' | null>(null);
const closes = ref<string[]>([]);
const afterClose = (name: string) => () => { closes.value = [...closes.value, name + (document.body.innerText.includes(name + ' body') ? ' visible' : ' gone')]; };
const cell = ref<HTMLInputElement | null>(null);
const unit = ref<string | null>('a');
const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
// Keeps its value in its own state, so it survives only while it stays mounted.
const Draft = defineComponent({ setup() { const value = ref(''); return () => <K.KjunInput ariaLabel="Kept input" modelValue={value.value} onUpdate:modelValue={(v: string) => { value.value = v; }} />; } });
const controlled = ref(false);
const events = ref<string[]>([]);
const log = (name: string) => (open: boolean) => { events.value = [...events.value, name + ' ' + open]; };
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
  <div data-testid="accordion"><K.KjunProvider>
    <K.KjunButton onClick={() => { controlled.value = !controlled.value; }}>toggle controlled</K.KjunButton>
    <K.KjunAccordion>
      <K.KjunAccordionItem title="Controlled" open={controlled.value} onUpdate:open={(v: boolean) => { log('controlled')(v); controlled.value = v; }}><K.KjunText>Controlled body</K.KjunText></K.KjunAccordionItem>
      <K.KjunAccordionItem title="First" onUpdate:open={log('first')}><K.KjunText>First body</K.KjunText></K.KjunAccordionItem>
      <K.KjunAccordionItem title="Second"><K.KjunText>Second body</K.KjunText></K.KjunAccordionItem>
      <K.KjunAccordionItem title="Kept" keepMounted><Draft /></K.KjunAccordionItem>
    </K.KjunAccordion>
    <K.KjunText>{'events: ' + (events.value.join(', ') || 'none')}</K.KjunText>
  </K.KjunProvider></div>
  <div data-testid="return-focus"><K.KjunProvider>
    <input ref={cell} aria-label="Target cell" />
    <K.KjunSelect ariaLabel="Unit select" options={options} modelValue={unit.value} onUpdate:modelValue={(v: any) => { unit.value = v; }} returnFocus={cell} />
    <K.KjunCombobox ariaLabel="Unit search" options={options} modelValue={unit.value} onUpdate:modelValue={(v: any) => { unit.value = v; }} returnFocus={cell} />
    <K.KjunMenuButton label="Actions" returnFocus={() => cell.value}><K.KjunDropdownItem onClick={() => {}}>Rename</K.KjunDropdownItem></K.KjunMenuButton>
  </K.KjunProvider></div>
</div>).mount('#root');
