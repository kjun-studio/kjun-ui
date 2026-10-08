import Vue from 'vue';
import * as ui from '@kjun-ui/vue2';
import { bindings, domain, fonts, samples, diagnosticCases, scenario, query } from './color-font-values';

Vue.config.errorHandler = error => (window as any).colorFontErrors.push(error.message);
new Vue({
  data: () => ({ changed: false, open: false, clicked: 0 }),
  render(h) {
    const numeric = scenario !== 'fallback';
    const button = (text: string, click: () => void) => h(ui.DsButton, { on: { click } }, text);
    const renderSamples = (prefix = '') => samples.map(([id, name, props]) => h('div', { attrs: { 'data-testid': prefix + id } }, [
      h((ui as any)[name], { props, on: { 'item-click': () => this.clicked++ } }),
    ]));
    if (scenario === 'scoped-domain') return h(ui.KjunProvider, { style: bindings('sans-serif', 'monospace') }, [
      h(ui.KjunProvider, { style: bindings('serif', 'cursive', {}) }, [h(ui.DsSignedValue, { props: { value: 2 } })]),
    ]);
    if (['missing-font', 'missing-domain', 'partial-domain', 'late-domain', 'core'].includes(scenario)) {
      const [name, props] = diagnosticCases[query.get('case') || 'signed'];
      const palette = scenario === 'partial-domain' ? { priceUp: domain().priceUp } : {};
      return h(ui.KjunProvider, { style: bindings(scenario === 'missing-font' ? '' : 'serif', undefined, palette) }, [
        button('Use price colors', () => { this.changed = true; }),
        ...(['core', 'missing-font'].includes(scenario)
          ? [h(ui.DsAnimatedNumber, { props: { value: 123, animated: false } }), h(ui.DsHeatmapCell, { props: { value: 12 } }), h(ui.DsProgressCell, { props: { value: 37 } })]
          : [scenario === 'late-domain' ? h(ui.DsHeatmapCell, { props: { value: 12, mode: this.changed ? 'price' : 'diverging' } })
            : h((ui as any)[name], { props }, 'Price badge')]),
      ]);
    }
    return h(ui.KjunProvider, { style: bindings('sans-serif', numeric ? 'cursive' : undefined) }, [
      h('div', { attrs: { 'data-testid': 'outer' } }, [h(ui.DsAnimatedNumber, { props: { value: 333, animated: false } })]),
      h(ui.KjunProvider, { style: bindings(fonts(this.changed).body, numeric ? fonts(this.changed).numeric : undefined, domain(this.changed)) }, [
        button('Change values', () => { this.changed = !this.changed; }),
        button('Open font dialog', () => { this.open = true; }),
        h('div', { attrs: { 'data-testid': 'ordinary' } }, [h(ui.DsBadge, '일반 배지')]),
        ...renderSamples(), h('output', { attrs: { 'data-testid': 'clicks' } }, this.clicked),
        h(ui.DsModal, { props: { value: this.open, title: 'Font dialog' }, on: { input: (open: boolean) => { this.open = open; } } }, [
          button('Change dialog values', () => { this.changed = !this.changed; }), ...renderSamples('dialog-'),
        ]),
      ]),
    ]);
  },
}).$mount('#root');
