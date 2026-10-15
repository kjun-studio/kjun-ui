import { createApp, defineComponent, reactive, ref } from 'vue';
import * as api from '@kjun-ui/vue3';
import { setRootValues } from './style-values';
setRootValues(); document.documentElement.style.setProperty('--kjun-font', 'Arial');
// Same initial values as motionConfig() in motion-cases.tsx, which imports React.
const motionConfig = () => ({ value: 100 as number | string, animated: true, fromPrevious: true, decimals: 2,
  tab: 'one', variant: 'underline' as 'underline' | 'pills', accept: true, width: 500, dir: 'ltr', paragraphs: 3, show: true,
  modal: false, drawer: false, position: 'right' as any, sw: false,
  items: [{ name: 'one', label: 'Overview' }, { name: 'two', label: 'Positions' }, { name: 'three', label: 'Activity log' }],
});
const Cases = defineComponent(() => {
  const config = reactive(motionConfig()), events = ref<any[]>([]);
  const feedback = api.useKjunFeedback();
  const change = (next: object) => Object.assign(config, next);
  Object.assign(window, { configureMotion: change, feedback });
  const scenario = new URLSearchParams(location.search).get('scenario') || 'numbers';
  return () => <>
    <div style={{ padding: '24px', width: config.width + 'px', maxWidth: '100%' }} dir={config.dir} data-testid="frame">
      {scenario === 'numbers' && config.show && <>
        <div data-testid="number"><api.KjunAnimatedNumber value={config.value} animated={config.animated} fromPrevious={config.fromPrevious} decimals={config.decimals} /></div>
        <div data-testid="price"><api.KjunPriceCell value={typeof config.value === 'number' ? config.value : null} formatter={(n: number) => n.toFixed(2)} /></div>
      </>}
      {scenario === 'tabs' && <api.KjunTabs modelValue={config.tab} items={config.items} variant={config.variant}
        onUpdate:modelValue={(value: string) => { if (config.accept) change({ tab: value }); events.value.push(value); }}>
        {config.items.map(item => <api.KjunTabPane key={item.name} {...item}>{item.name + ' content'}</api.KjunTabPane>)}
      </api.KjunTabs>}
      {scenario === 'accordion' && <api.KjunAccordion><api.KjunAccordionItem title="Expand details">
        <div data-testid="details" style={{ height: config.paragraphs * 40 + 'px' }}>Accordion content</div>
      </api.KjunAccordionItem></api.KjunAccordion>}
      {scenario === 'layers' && <>
        <button onClick={() => change({ modal: true })}>Open modal</button>
        <button onClick={() => change({ drawer: true })}>Open drawer</button>
        <api.KjunDropdown>{{ trigger: () => <api.KjunButton>Open menu</api.KjunButton>, default: () => <api.KjunDropdownItem>Menu choice</api.KjunDropdownItem> }}</api.KjunDropdown>
        <api.KjunModal open={config.modal} onUpdate:open={(modal: boolean) => change({ modal })} onClose={() => events.value.push('modal-close')} title="Motion modal">
          <div>Modal content</div>
        </api.KjunModal>
        <api.KjunDrawer open={config.drawer} onUpdate:open={(drawer: boolean) => change({ drawer })} onClose={() => events.value.push('drawer-close')} title="Motion drawer" position={config.position}>
          <div style={{ height: '180px' }}>Drawer content</div>
        </api.KjunDrawer>
      </>}
      {scenario === 'switch' && <api.KjunSwitch label="Motion switch" modelValue={config.sw} onUpdate:modelValue={(sw: boolean) => change({ sw })} />}
      {scenario === 'popover' && <api.KjunPopover ariaLabel="Motion popover">{{ trigger: () => <api.KjunButton>Open popover</api.KjunButton>, default: () => 'Popover content' }}</api.KjunPopover>}
      {scenario === 'spinner' && <><api.KjunSpinner /><api.KjunIcon name="refresh" spin /></>}
    </div>
    <output data-testid="events">{JSON.stringify(events.value)}</output><output data-testid="tab-value">{config.tab}</output>
  </>;
});
createApp(defineComponent(() => () => <api.KjunProvider><api.KjunFeedbackProvider><Cases /></api.KjunFeedbackProvider></api.KjunProvider>)).mount('#root');
