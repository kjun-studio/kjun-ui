import { createApp, defineComponent, h, shallowRef } from 'vue';
import type { KjunIconRegistry } from '@kjun-ui/icons';
import examples from '../../artifacts/examples/vue3';
import { exampleNames } from '../../shared/example-registry';
import { applyDemoColors } from '../../shared/demo-colors';
import { cardPreviewStyle } from '../../shared/card-examples';
import { connectCatalog, exampleObserver, settingsFor, type CatalogConfig } from './runtime';
const icons = shallowRef<KjunIconRegistry>({}), current = shallowRef<CatalogConfig | null>(null);
createApp(defineComponent(() => () => {
  const config = current.value;
  if (!config) return h('div');
  return h('main', { class: 'catalog-root', style: cardPreviewStyle(config.component, config.settings.surface, config.palette), 'data-foundation-layout': String(config.component === 'GuideScreenLayout') },
    (config.component === 'all' ? exampleNames : [config.component]).map(name => h((examples as any)[name], {
      key: name + config.reset, settings: settingsFor(name, config), icons: icons.value,
      initialValues: config.component === 'all' ? {} : config.values, observer: exampleObserver(name),
    })));
})).mount('#root');
connectCatalog((config, registry) => { applyDemoColors(config.palette); icons.value = registry; current.value = config; });
