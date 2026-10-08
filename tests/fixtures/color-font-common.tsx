import { Component, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { bindings, colors, domain, fonts, samples, diagnosticCases, scenario, query } from './color-font-values';

class Boundary extends Component<{ children: ReactNode }, { error: string }> {
  state = { error: '' };
  static getDerivedStateFromError(error: Error) { return { error: error.message }; }
  componentDidCatch(error: Error) { (window as any).colorFontErrors.push(error.message); }
  render() { return this.state.error ? <div role="alert">{this.state.error}</div> : this.props.children; }
}
export function mount(ui: any, native = false) {
  const { KjunProvider, DsButton, DsModal, DsAnimatedNumber, DsBadge, DsHeatmapCell } = ui;
  const press = (onClick: () => void) => native ? { onPress: onClick } : { onClick };
  function App() {
    const [changed, change] = useState(false), [open, setOpen] = useState(false), [clicked, setClicked] = useState(0);
    const numeric = scenario !== 'fallback';
    const provider = (body: string, number?: string, palette: any = domain()) => native
      ? { colors, fontFamily: body || undefined, numericFontFamily: number, domainColors: palette ?? undefined }
      : { style: bindings(body, number, palette || {}) };
    const renderSamples = (prefix = '') => samples.map(([id, name, props]) => {
      const C = ui[name];
      return <div key={id} data-testid={prefix + id}><C {...props} onItemClick={() => setClicked(value => value + 1)} /></div>;
    });
    if (scenario === 'scoped-domain') return <KjunProvider {...provider('sans-serif', 'monospace')}>
      <KjunProvider {...provider('serif', 'cursive', {})}><ui.DsSignedValue value={2} /></KjunProvider>
    </KjunProvider>;
    if (['missing-font', 'missing-domain', 'partial-domain', 'late-domain', 'core'].includes(scenario)) {
      const [name, props] = diagnosticCases[query.get('case') || 'signed'], C = ui[name];
      const palette = scenario === 'partial-domain' ? { priceUp: domain().priceUp } : undefined;
      return <KjunProvider {...provider(scenario === 'missing-font' ? '' : 'serif', undefined, palette ?? (native ? null : {}))}>
        <DsButton {...press(() => change(true))}>Use price colors</DsButton>
        {scenario === 'core' || scenario === 'missing-font' ? <>
          <DsAnimatedNumber value={123} animated={false} /><DsHeatmapCell value={12} /><ui.DsProgressCell value={37} />
        </> : scenario === 'late-domain' ? <DsHeatmapCell value={12} mode={changed ? 'price' : 'diverging'} /> : <C {...props}>Price badge</C>}
      </KjunProvider>;
    }
    return <KjunProvider {...provider('sans-serif', numeric ? 'cursive' : undefined)}>
      <div data-testid="outer"><DsAnimatedNumber value={333} animated={false} /></div>
      <KjunProvider {...provider(fonts(changed).body, numeric ? fonts(changed).numeric : undefined, domain(changed))}>
        <DsButton {...press(() => change(value => !value))}>Change values</DsButton>
        <DsButton {...press(() => setOpen(true))}>Open font dialog</DsButton>
        <div data-testid="ordinary"><DsBadge>일반 배지</DsBadge></div>
        {renderSamples()}
        <output data-testid="clicks">{clicked}</output>
        <DsModal open={open} onOpenChange={setOpen} title="Font dialog">
          <DsButton {...press(() => change(value => !value))}>Change dialog values</DsButton>
          {renderSamples('dialog-')}
        </DsModal>
      </KjunProvider>
    </KjunProvider>;
  }
  createRoot(document.getElementById('root')!).render(<Boundary><App /></Boundary>);
}
