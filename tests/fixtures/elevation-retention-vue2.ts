import Vue from 'vue';
import * as K from '@kjun-ui/vue2';
import { cssPalette } from './typography-values';
cssPalette();
const query = new URLSearchParams(location.search);
const First = query.get('kind') === 'drawer' ? K.DsDrawer : K.DsModal;
const button = (h: any, label: string, action: () => void) => h(K.DsButton, { on: { click: action } }, label);
const Editor = Vue.extend({
  inject: ['draftContext'],
  data: () => ({ draft: 'Original', count: 0 }),
  render(h) { return h('div', [
    h(K.DsTextarea, { props: { ariaLabel: 'Draft', value: this.draft }, on: { input: (value: string) => this.draft = value } }),
    button(h, 'Edit count ' + this.count, () => this.count++),
    h('span', { attrs: { 'data-testid': 'draft-context' } }, (this as any).draftContext),
  ]); },
});
const Cases = Vue.extend({
  inject: ['kjunFeedback'],
  provide: { draftContext: 'Project context' },
  data: () => ({ first: false, second: false, actions: 0, mounted: true }),
  mounted() { Object.assign(window, { retention: {
    reopen: async () => { this.first = false; if (query.has('interleaved')) setTimeout(() => this.second = true, 20); setTimeout(() => this.first = true, query.has('interleaved') ? 60 : 30); await this.$nextTick(); await this.$nextTick(); },
    toast: () => (this as any).kjunFeedback.toast.info('Retained result', { duration: 0, action: { label: 'Toast action', onClick: () => this.actions++ } }),
    unmount: () => this.mounted = false,
  } }); },
  render(h) { return h('div', [
    button(h, 'Open first', () => this.first = true), button(h, 'Page action', () => this.actions++),
    h('output', { attrs: { 'data-testid': 'actions' } }, String(this.actions)),
    this.mounted && h(First, { props: { value: this.first, title: 'First window' }, on: { input: (value: boolean) => this.first = value } }, [h(Editor)]),
    this.mounted && h(K.KjunProvider, [h(K.DsModal, { props: { value: this.second, title: 'Second window' }, on: { input: (value: boolean) => this.second = value } }, [button(h, 'Second action', () => this.actions++)])]),
  ]); },
});
new Vue({ render: h => h(K.KjunProvider, [h(K.KjunFeedbackProvider, [h(Cases)])]) }).$mount('#root');
