import { createElement as h, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { cssPalette, palette, demoFont } from './typography-values';

export function mountProviderLayers(K: any, native: boolean) {
  cssPalette();
  function Cases() {
    const [outer, setOuter] = useState(false), [inner, setInner] = useState(false), [drawer, setDrawer] = useState(false);
    const [present, setPresent] = useState(true), [changed, setChanged] = useState(false);
    const [events, setEvents] = useState<string[]>([]);
    const record = (name: string, set: (v: boolean) => void) => (v: boolean) => { set(v); if (!v) setEvents(e => [...e, name]); };
    const button = (name: string, action?: () => void) => h(K.DsButton, { [native ? 'onPress' : 'onClick']: action }, name);
    const provider = (children: any, scoped = false) => h(K.KjunProvider, native
      ? { colors: { ...palette(), ...(scoped ? { surface: changed ? '#ddeeff' : '#fff4dd' } : {}) }, fontFamily: demoFont }
      : { style: scoped ? { '--kjun-surface': changed ? '#ddeeff' : '#fff4dd', '--kjun-font': 'monospace' } : {} }, children);
    Object.assign(window, { providerLayers: { unmount: () => setPresent(false), changeStyle: () => setChanged(true) } });
    return provider(h('div', { style: { padding: 20 } },
      button('Open outer', () => setOuter(true)), h('output', { 'data-testid': 'events' }, events.join(',')),
      h(K.DsModal, { open: outer, onOpenChange: record('outer', setOuter), title: 'Outer dialog' },
        button('Outer action'), present && provider(h('div', null,
          button('Open inner', () => setInner(true)), button('Open drawer', () => setDrawer(true)),
          h(K.DsPopover, { ariaLabel: 'Scoped popup', trigger: button('Open popup') }, button('Popup action')),
          h(K.DsModal, { open: inner, onOpenChange: record('inner', setInner), title: 'Inner dialog' },
            button('Inner action'), h(K.DsInput, { ariaLabel: 'Inner input' }),
            h(K.DsPopover, { ariaLabel: 'Inner popup', trigger: button('Open inner popup') }, button('Inner popup action'))),
          h(K.DsDrawer, { open: drawer, onOpenChange: record('drawer', setDrawer), title: 'Inner drawer' }, button('Drawer action')),
        ), true)),
    ));
  }
  createRoot(document.getElementById('root')!).render(h(Cases));
}
