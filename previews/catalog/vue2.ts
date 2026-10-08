import Vue from 'vue';
import type { KjunIconRegistry } from '@kjun-ui/icons';
import examples from '../../artifacts/examples/vue2';
import { exampleNames, presetConfig } from '../../shared/example-registry';
import { applyDemoColors } from '../../shared/demo-colors';
import { cardPreviewStyle } from '../../shared/card-examples';
import { connectCatalog, exampleObserver, settingsFor, type CatalogConfig } from './runtime';
Vue.config.productionTip = false;
const app = new Vue({
  data: () => ({ icons: {} as KjunIconRegistry, config: null as CatalogConfig | null }),
  render(h) {
    const config = this.config;
    if (!config) return h('div');
    return h('main', { class: 'catalog-root', style: cardPreviewStyle(config.component, config.settings.surface, config.palette), attrs: { 'data-foundation-layout': String(config.component === 'GuideScreenLayout') } }, (config.component === 'all' ? exampleNames : [config.component]).map(name =>
      h((examples as any)[name], { key: name + config.reset, props: {
        settings: settingsFor(name, config), icons: this.icons,
        initialValues: config.component === 'all' ? {} : config.values, observer: exampleObserver(name),
      } })));
  },
}).$mount('#root');
connectCatalog((config, icons) => { applyDemoColors(config.palette); app.icons = icons; app.config = config; });
