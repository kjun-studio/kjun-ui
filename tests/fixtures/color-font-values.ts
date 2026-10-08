import { domainColorRoles } from '@kjun/tokens';
import { demoPalettes, demoDomainPalettes, cssColorName } from '../../shared/demo-colors';

export const query = new URLSearchParams(location.search);
export const scenario = query.get('scenario') || 'normal';
export const colors = demoPalettes.default;
export const domain = (changed = false) => ({ ...demoDomainPalettes.default,
  priceUp: changed ? '#7c3299' : '#16734a', priceUpBg: changed ? '#f0e4f4' : '#e1f3e8',
  priceDown: changed ? '#845000' : '#235cd2', priceDownBg: changed ? '#f8efdb' : '#e4ecfa',
});
export const fonts = (changed = false) => ({ body: changed ? 'sans-serif' : 'serif', numeric: changed ? 'serif' : 'monospace' });
export function bindings(body: string, numeric?: string, palette: Record<string, string> = domain()) {
  return { ...Object.fromEntries(Object.entries(colors).map(([key, value]) => [cssColorName(key), value])),
    ...Object.fromEntries(domainColorRoles.map(key => [cssColorName(key), palette[key] || 'initial'])),
    '--kjun-font': body || 'initial', '--kjun-font-numeric': numeric || 'initial' };
}
export const samples = [
  ['number', 'DsAnimatedNumber', { value: 123, animated: false }],
  ['heat', 'DsHeatmapCell', { value: 12 }],
  ['progress', 'DsProgressCell', { value: 37 }],
  ...['text', 'pill', 'badge'].flatMap(variant => [
    ['up-' + variant, 'DsDeviation', { value: 2, variant }],
    ['down-' + variant, 'DsDeviation', { value: -2, variant }],
  ]),
  ['neutral', 'DsDeviation', { value: 0, variant: 'badge', signalThreshold: 0 }],
  ['kpi', 'DsKpiRow', { items: [
    { label: 'Text label', value: 'TEXT VALUE', valueKind: 'text', prefix: '접두', suffix: '접미', clickable: true },
    { label: 'Numeric label', value: 123456 },
    { label: 'Animated text', value: 42, valueKind: 'text', animated: true },
    { label: 'Segments', value: '', valueKind: 'text', valueSegments: [{ label: '그룹', text: 'segment' }] },
  ] }],
] as const;
export const diagnosticCases: Record<string, [string, Record<string, unknown>]> = {
  signed: ['DsSignedValue', { value: 2 }],
  deviation: ['DsDeviation', { value: 2 }],
  heat: ['DsHeatmapCell', { value: 2, mode: 'price' }],
  badge: ['DsBadge', { variant: 'price-up' }],
  kpi: ['DsKpiRow', { items: [{ label: 'price', value: 2, semantic: 'price' }] }],
  hero: ['DsKpiHero', { label: 'price', value: 2, deltaPercent: 2 }],
  sparkline: ['DsSparkline', { data: [1, 2, 3] }],
  collection: ['DsCollectionMark', { kind: 'favorite', active: true }],
  table: ['DsTable', { data: [{ value: 2 }], columns: [{ key: 'value', label: 'Value', pill: true }] }],
  market: ['DsMarketTable', { rows: [{ id: 1, name: 'Test' }], columns: [], showActions: true }],
  flash: ['DsPriceCell', { value: 2, flashClass: 'price-flash-up' }],
};
Object.assign(window, { colorFontErrors: [] as string[] });
// Functional Vue VNode hooks report through window.error rather than errorHandler.
window.addEventListener('error', event => (window as any).colorFontErrors.push(event.message));
