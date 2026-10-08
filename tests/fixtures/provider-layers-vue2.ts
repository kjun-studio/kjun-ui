import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
cssPalette();
new Vue({
  data: () => ({ outer: false, inner: false, drawer: false, present: true, changed: false, events: [] as string[] }),
  mounted() { Object.assign(window, { providerLayers: { unmount: () => this.present = false, changeStyle: () => this.changed = true } }); },
  render(h) {
    const button = (name: string, click?: () => void) => h(K.DsButton, { on: { click: click || (() => {}) } }, name);
    const change = (key: 'outer' | 'inner' | 'drawer') => (v: boolean) => { this[key] = v; if (!v) this.events.push(key); };
    const popup = (name: string, action: string) => h(K.DsPopover, { props: { ariaLabel: name }, scopedSlots: { trigger: () => button(name) } }, [button(action)]);
    return h(K.KjunProvider, [button('Open outer', () => this.outer = true), h('output', { attrs: { 'data-testid': 'events' } }, this.events.join(',')),
      h(K.DsModal, { props: { value: this.outer, title: 'Outer dialog' }, on: { input: change('outer') } }, [
        button('Outer action'), this.present && h(K.KjunProvider, { style: { '--kjun-surface': this.changed ? '#ddeeff' : '#fff4dd', '--kjun-font': 'monospace' } }, [
          button('Open inner', () => this.inner = true), button('Open drawer', () => this.drawer = true), popup('Open popup', 'Popup action'),
          h(K.DsModal, { props: { value: this.inner, title: 'Inner dialog' }, on: { input: change('inner') } }, [button('Inner action'), h(K.DsInput, { props: { ariaLabel: 'Inner input' } }), popup('Open inner popup', 'Inner popup action')]),
          h(K.DsDrawer, { props: { value: this.drawer, title: 'Inner drawer' }, on: { input: change('drawer') } }, [button('Drawer action')]),
        ]),
      ]),
    ]);
  },
}).$mount('#root');
