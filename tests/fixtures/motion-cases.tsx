import { flushSync } from "react-dom";
import { useState } from 'react';
export const motionConfig = () => ({ value: 100 as number | string, animated: true, fromPrevious: true, decimals: 2,
  tab: 'one', variant: 'underline', accept: true, width: 500, dir: 'ltr', paragraphs: 3, show: true,
  modal: false, drawer: false, position: 'right', sw: false,
  items: [{ name: 'one', label: 'Overview' }, { name: 'two', label: 'Positions' }, { name: 'three', label: 'Activity log' }],
});
export function MotionCases({ api }: { api: any }) {
  const [config, setConfig] = useState(motionConfig), [events, setEvents] = useState<any[]>([]);
  const feedback = api.useKjunFeedback();
  const change = (next: object) => setConfig(old => ({ ...old, ...next }));
  Object.assign(window, { configureMotion: (next: object) => flushSync(() => change(next)), feedback });
  const scenario = new URLSearchParams(location.search).get('scenario') || 'numbers';
  const { DsAnimatedNumber: NumberView, DsPriceCell: Price, DsTabs: Tabs, DsTabPane: Pane, DsAccordion: Accordion,
    DsAccordionItem: Item, DsModal: Modal, DsDrawer: Drawer, DsDropdown: Dropdown, DsDropdownItem: MenuItem,
    DsButton: Button, DsSwitch: Switch, DsSpinner: Spinner, DsIcon: Icon, DsPopover: Popover } = api;
  return <>
    <div style={{ padding: 24, width: config.width, maxWidth: '100%' }} dir={config.dir} data-testid="frame">
      {scenario === 'numbers' && config.show && <>
        <div data-testid="number"><NumberView value={config.value} animated={config.animated} fromPrevious={config.fromPrevious} decimals={config.decimals} /></div>
        <div data-testid="price"><Price value={typeof config.value === 'number' ? config.value : null} formatter={(n: number) => n.toFixed(2)} /></div>
      </>}
      {scenario === 'tabs' && <Tabs value={config.tab} items={config.items} variant={config.variant}
        onValueChange={(value: string) => { if (config.accept) change({ tab: value }); setEvents(old => [...old, value]); }}>
        {config.items.map(item => <Pane key={item.name} {...item}>{item.name + ' content'}</Pane>)}
      </Tabs>}
      {scenario === 'accordion' && <Accordion><Item title="Expand details"><div data-testid="details" style={{ height: config.paragraphs * 40 }}>Accordion content</div></Item></Accordion>}
      {scenario === 'layers' && <>
        <button onClick={() => change({ modal: true })}>Open modal</button>
        <button onClick={() => change({ drawer: true })}>Open drawer</button>
        <Dropdown trigger={<Button>Open menu</Button>}><MenuItem>Menu choice</MenuItem></Dropdown>
        <Modal open={config.modal} onOpenChange={(modal: boolean) => change({ modal })} onClose={() => setEvents(old => [...old, 'modal-close'])} title="Motion modal"><div>Modal content</div></Modal>
        <Drawer open={config.drawer} onOpenChange={(drawer: boolean) => change({ drawer })} onClose={() => setEvents(old => [...old, 'drawer-close'])} title="Motion drawer" position={config.position}><div style={{ height: 180 }}>Drawer content</div></Drawer>
      </>}
      {scenario === 'switch' && <Switch label="Motion switch" value={config.sw} onValueChange={(sw: boolean) => change({ sw })} />}
      {scenario === 'popover' && <Popover trigger={<Button>Open popover</Button>} ariaLabel="Motion popover">Popover content</Popover>}
      {scenario === 'spinner' && <><Spinner /><Icon name="refresh" spin /></>}
    </div>
    <output data-testid="events">{JSON.stringify(events)}</output><output data-testid="tab-value">{config.tab}</output>
  </>;
}
