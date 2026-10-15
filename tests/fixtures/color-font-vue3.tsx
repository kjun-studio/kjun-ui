import { createApp, defineComponent, reactive } from 'vue';
import * as ui from '@kjun-ui/vue3';
import { bindings, domain, fonts, samples, diagnosticCases, scenario, query } from './color-font-values';

const state = reactive({ changed: false, open: false, clicked: 0 });
const { KjunProvider, KjunButton, KjunModal, KjunAnimatedNumber, KjunBadge, KjunHeatmapCell } = ui as any;
const renderSamples = (prefix = '') => samples.map(([id, name, props]) => {
  const C = (ui as any)[name];
  return <div key={id} data-testid={prefix + id}><C {...props} onItemClick={() => { state.clicked++; }} /></div>;
});
const App = defineComponent(() => () => {
  const numeric = scenario !== 'fallback';
  if (scenario === 'scoped-domain') return <KjunProvider style={bindings('sans-serif', 'monospace')}>
    <KjunProvider style={bindings('serif', 'cursive', {})}><ui.KjunSignedValue value={2} /></KjunProvider>
  </KjunProvider>;
  if (['missing-font', 'missing-domain', 'partial-domain', 'late-domain', 'core'].includes(scenario)) {
    const [name, props] = diagnosticCases[query.get('case') || 'signed'], C = (ui as any)[name];
    const palette = scenario === 'partial-domain' ? { priceUp: domain().priceUp } : {};
    return <KjunProvider style={bindings(scenario === 'missing-font' ? '' : 'serif', undefined, palette)}>
      <KjunButton onClick={() => { state.changed = true; }}>Use price colors</KjunButton>
      {scenario === 'core' || scenario === 'missing-font' ? <>
        <KjunAnimatedNumber value={123} animated={false} /><KjunHeatmapCell value={12} /><ui.KjunProgressCell value={37} />
      </> : scenario === 'late-domain' ? <KjunHeatmapCell value={12} mode={state.changed ? 'price' : 'diverging'} /> : <C {...props}>Price badge</C>}
    </KjunProvider>;
  }
  return <KjunProvider style={bindings('sans-serif', numeric ? 'cursive' : undefined)}>
    <div data-testid="outer"><KjunAnimatedNumber value={333} animated={false} /></div>
    <KjunProvider style={bindings(fonts(state.changed).body, numeric ? fonts(state.changed).numeric : undefined, domain(state.changed))}>
      <KjunButton onClick={() => { state.changed = !state.changed; }}>Change values</KjunButton>
      <KjunButton onClick={() => { state.open = true; }}>Open font dialog</KjunButton>
      <div data-testid="ordinary"><KjunBadge>일반 배지</KjunBadge></div>
      {renderSamples()}
      <output data-testid="clicks">{String(state.clicked)}</output>
      <KjunModal open={state.open} onUpdate:open={(open: boolean) => { state.open = open; }} title="Font dialog">
        <KjunButton onClick={() => { state.changed = !state.changed; }}>Change dialog values</KjunButton>
        {renderSamples('dialog-')}
      </KjunModal>
    </KjunProvider>
  </KjunProvider>;
});
const app = createApp(App);
app.config.errorHandler = error => (window as any).colorFontErrors.push((error as Error).message);
app.mount('#root');
