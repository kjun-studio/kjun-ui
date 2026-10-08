import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import examples from '../../artifacts/examples/react';
import { exampleNames, presetConfig } from '../../shared/example-registry';
import { applyDemoColors } from '../../shared/demo-colors';
import { cardPreviewStyle } from '../../shared/card-examples';
import { connectCatalog, exampleObserver, settingsFor } from './runtime';
const root = createRoot(document.getElementById('root')!);
connectCatalog((config, icons) => {
  applyDemoColors(config.palette);
  const names = config.component === 'all' ? exampleNames : [config.component];
  root.render(<main className="catalog-root" style={cardPreviewStyle(config.component, config.settings.surface, config.palette)} data-foundation-layout={config.component === "GuideScreenLayout"}>{names.map(name => createElement((examples as any)[name], {
    key: name + config.reset, settings: settingsFor(name, config), icons,
    initialValues: config.component === 'all' ? {} : config.values, observer: exampleObserver(name),
  }))}</main>);
});
