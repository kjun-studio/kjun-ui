import Vue from 'vue';
import * as api from '@kjun/vue2';
import { setRootValues } from './style-values';
import { motionConfig } from './motion-cases';
setRootValues(); document.documentElement.style.setProperty('--kjun-font', 'Arial');
const Cases = Vue.extend({
  inject: ['kjunFeedback'],
  data: () => ({ ...motionConfig(), events: [] as any[] }),
  mounted() { Object.assign(window, { configureMotion: (next: object) => Object.assign(this, next), feedback: (this as any).kjunFeedback }); },
  render(h) {
    const scenario = new URLSearchParams(location.search).get('scenario') || 'numbers';
    const content = [];
    if (scenario === 'numbers' && this.show) content.push(
      h('div', { attrs: { 'data-testid': 'number' } }, [h(api.DsAnimatedNumber, { props: { value: this.value, animated: this.animated, fromPrevious: this.fromPrevious, decimals: this.decimals } })]),
      h('div', { attrs: { 'data-testid': 'price' } }, [h(api.DsPriceCell, { props: { value: typeof this.value === 'number' ? this.value : null, formatter: (n: number) => n.toFixed(2) } })]),
    );
    if (scenario === 'tabs') content.push(h(api.DsTabs, { props: { value: this.tab, items: this.items, variant: this.variant }, on: {
      input: (tab: string) => { if (this.accept) this.tab = tab; this.events.push(tab); },
    } }, this.items.map(item => h(api.DsTabPane, { key: item.name, props: item }, item.name + ' content'))));
    if (scenario === 'accordion') content.push(h(api.DsAccordion, [h(api.DsAccordionItem, { props: { title: 'Expand details' } }, [h('div', { attrs: { 'data-testid': 'details' }, style: { height: this.paragraphs * 40 + 'px' } }, 'Accordion content')])]));
    if (scenario === 'layers') content.push(
      h('button', { on: { click: () => { this.modal = true; } } }, 'Open modal'),
      h('button', { on: { click: () => { this.drawer = true; } } }, 'Open drawer'),
      h(api.DsDropdown, [h(api.DsButton, { slot: 'trigger' }, 'Open menu'), h(api.DsDropdownItem, 'Menu choice')]),
      h(api.DsModal, { props: { value: this.modal, title: 'Motion modal' }, on: { input: (v: boolean) => { this.modal = v; }, close: () => this.events.push('modal-close') } }, ['Modal content']),
      h(api.DsDrawer, { props: { value: this.drawer, title: 'Motion drawer', position: this.position }, on: { input: (v: boolean) => { this.drawer = v; }, close: () => this.events.push('drawer-close') } }, [h('div', { style: { height: '180px' } }, 'Drawer content')]),
    );
    if (scenario === 'switch') content.push(h(api.DsSwitch, { props: { value: this.sw, label: 'Motion switch' }, on: { input: (sw: boolean) => { this.sw = sw; } } }));
    if (scenario === 'spinner') content.push(h(api.DsSpinner), h(api.DsIcon, { props: { name: 'refresh', spin: true } }));
    return h('div', [h('div', { attrs: { 'data-testid': 'frame', dir: this.dir }, style: { padding: '24px', width: this.width + 'px', maxWidth: '100%' } }, content),
      h('output', { attrs: { 'data-testid': 'events' } }, JSON.stringify(this.events)), h('output', { attrs: { 'data-testid': 'tab-value' } }, this.tab)]);
  },
});
new Vue({ render: h => h(api.KjunProvider, [h(api.KjunFeedbackProvider, [h(Cases)])]) }).$mount('#root');
