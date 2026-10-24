import { useRef, useState } from 'react';
// 0.15.0 adopter requests on React and Native (Vue 3 mirrors this in requests-vue3.tsx). One section per feature.
// Keeps its value in its own state, so it survives only while it stays mounted.
function Draft({ K, native }: { K: any; native: boolean }) {
  const [value, setValue] = useState('');
  return <K.KjunInput ariaLabel="Kept input" value={value} {...(native ? { onChangeText: setValue } : { onValueChange: setValue })} />;
}
export function RequestsCases({ K, native = false, providerProps = {} }: { K: any; native?: boolean; providerProps?: Record<string, any> }) {
  const press = (handler: () => void) => native ? { onPress: handler } : { onClick: handler };
  const [layer, setLayer] = useState<'drawer' | 'modal' | null>(null);
  const [closes, setCloses] = useState<string[]>([]);
  // Records whether the layer's body was still on screen when the close was reported.
  const afterClose = (name: string) => () => setCloses(list => [...list, name + (document.body.innerText.includes(name + ' body') ? ' visible' : ' gone')]);
  const cell = useRef<HTMLInputElement>(null);
  const [unit, setUnit] = useState<string | null>('a');
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const [controlled, setControlled] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const log = (name: string) => (open: boolean) => setEvents(list => [...list, name + ' ' + open]);
  const reopen = () => { const name = layer; setLayer(null); setTimeout(() => setLayer(name), 30); };
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
    <div data-testid="after-close"><K.KjunProvider {...providerProps}>
      <K.KjunButton {...press(() => setLayer('drawer'))}>open drawer</K.KjunButton>
      <K.KjunButton {...press(() => setLayer('modal'))}>open modal</K.KjunButton>
      <K.KjunText>{'closes: ' + (closes.join(', ') || 'none')}</K.KjunText>
      <K.KjunDrawer open={layer === 'drawer'} onOpenChange={(v: boolean) => !v && setLayer(null)} title="Drawer" onAfterClose={afterClose('Drawer')}>
        <K.KjunText>Drawer body</K.KjunText>
        <K.KjunButton {...press(() => setLayer(null))}>close drawer</K.KjunButton>
        <K.KjunButton {...press(reopen)}>reopen drawer</K.KjunButton>
      </K.KjunDrawer>
      <K.KjunModal open={layer === 'modal'} onOpenChange={(v: boolean) => !v && setLayer(null)} title="Modal" onAfterClose={afterClose('Modal')}>
        <K.KjunText>Modal body</K.KjunText>
        <K.KjunButton {...press(() => setLayer(null))}>close modal</K.KjunButton>
        <K.KjunButton {...press(reopen)}>reopen modal</K.KjunButton>
      </K.KjunModal>
    </K.KjunProvider></div>
    <div data-testid="rows"><K.KjunProvider {...providerProps}>
      <K.KjunListSection ariaLabel="Spending">
        <K.KjunListRow title="Coffee" description="Today" trailing={<K.KjunText>-4,500</K.KjunText>} ariaLabel="Coffee, today, minus 4,500 won" {...press(() => {})}>
          <K.KjunProgress value={60} label="Budget" />
        </K.KjunListRow>
      </K.KjunListSection>
    </K.KjunProvider></div>
    <div data-testid="text-props"><K.KjunProvider {...providerProps}>
      <K.KjunText {...(native ? { accessibilityLabel: 'Balance 1,000 won', testID: 'balance' } : { 'aria-label': 'Balance 1,000 won', 'data-testid': 'balance' })}>1,000</K.KjunText>
    </K.KjunProvider></div>
    <div data-testid="accordion"><K.KjunProvider {...providerProps}>
      <K.KjunButton {...press(() => setControlled(v => !v))}>toggle controlled</K.KjunButton>
      <K.KjunAccordion>
        <K.KjunAccordionItem title="Controlled" open={controlled} onOpenChange={(v: boolean) => { log('controlled')(v); setControlled(v); }}><K.KjunText>Controlled body</K.KjunText></K.KjunAccordionItem>
        <K.KjunAccordionItem title="First" onOpenChange={log('first')}><K.KjunText>First body</K.KjunText></K.KjunAccordionItem>
        <K.KjunAccordionItem title="Second"><K.KjunText>Second body</K.KjunText></K.KjunAccordionItem>
        <K.KjunAccordionItem title="Kept" keepMounted><Draft K={K} native={native} /></K.KjunAccordionItem>
      </K.KjunAccordion>
      <K.KjunText>{'events: ' + (events.join(', ') || 'none')}</K.KjunText>
    </K.KjunProvider></div>
    {!native && <div data-testid="return-focus"><K.KjunProvider {...providerProps}>
      <input ref={cell} aria-label="Target cell" />
      <K.KjunSelect ariaLabel="Unit select" options={options} value={unit} onValueChange={setUnit} returnFocus={cell} />
      <K.KjunCombobox ariaLabel="Unit search" options={options} value={unit} onValueChange={setUnit} returnFocus={cell} />
      <K.KjunMenuButton label="Actions" returnFocus={() => cell.current}><K.KjunDropdownItem onClick={() => {}}>Rename</K.KjunDropdownItem></K.KjunMenuButton>
    </K.KjunProvider></div>}
  </div>;
}
