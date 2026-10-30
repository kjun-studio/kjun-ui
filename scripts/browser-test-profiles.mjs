import { contractFiles, contractsForScope } from './browser-contract-scopes.mjs';
const files = (...names) => names.map(name => `tests/browser/${name}.spec.ts`);
export const smokeFiles = files('expanded', 'card-contract', 'data-state-design');
const contracts = files('api-reference', 'vue-contracts');
const fields = files('input-contracts', 'controlled-state', 'live-updates', 'accessibility-controls');
const visuals = files('native-layout', 'size-contracts', 'style-boundary', 'host-globals', 'domain-color-check');
const layers = files('elevation', 'elevation-edges', 'elevation-inputs', 'elevation-keyboard',
  'elevation-order', 'elevation-reopen', 'elevation-retention', 'provider-layers',
  'layer-contracts', 'layer-motion-edges', 'layer-unmount', 'focus-containment', 'popup-escape', 'styles');

// 제목 필터 대신 파일 전체를 선택해 플랫폼별 사례와 함께 쓰이는 컴포넌트를 보존한다.
const componentGroups = {
  alert: [...files('alert-design', 'accessibility-components', 'chip-toast-tokens'), ...visuals],
  'data-state': [...files('data-state-design', 'loading-options', 'table-contracts', 'runtime-cards', 'runtime-market'), ...contracts],
  card: [...files('card-contract', 'card-review', 'card-layout', 'card-colors', 'card-hairline', 'geometry-tokens'), ...visuals],
  table: [...files('table-contracts', 'loading-options', 'runtime-cards', 'data-state-design', 'accessibility-components'), ...contracts, ...visuals],
  market: [...files('runtime-market', 'loading-options', 'data-state-design', 'geometry-tokens'), ...visuals],
  select: [...files('select-scroll', 'expanded', 'elevation-inputs', 'popup-escape', 'react-tabs-actions'), ...fields, ...contracts, ...visuals],
  combobox: [...files('select-scroll', 'popup-escape', 'elevation-inputs'), ...fields, ...contracts, ...visuals],
  'search-input': [...files('search-input', 'elevation-inputs'), ...fields, ...contracts],
  input: [...files('input-design', 'interaction-states', 'search-input', 'quantity', 'feedback-input', 'elevation-inputs'), ...fields, ...contracts, ...visuals],
  button: [...files('button-design', 'interaction-states', 'button-group-motion', 'form-actions', 'bottom-action-bar-design', 'menu-button', 'refresh-button', 'copy-button-feedback', 'icon-toggle', 'accessibility-components'), ...visuals],
  form: [...files('form-actions', 'layout-primitives', 'input-design', 'interaction-states', 'feedback-input', 'quantity', 'bottom-action-bar-design'), ...fields, ...contracts],
  tabs: [...files('tabs-contract', 'tabs-design', 'accessibility-tabs', 'controlled-state', 'live-updates', 'component-motion', 'expanded', 'react-tabs-actions'), ...visuals],
  accordion: [...files('accordion-design', 'controlled-state', 'component-motion', 'expanded', 'accessibility-components'), ...visuals],
  navigation: [...files('top-navigation-design', 'bottom-navigation-design', 'bottom-action-bar-design', 'accessibility-components'), ...visuals],
  feedback: [...files('feedback-dialog', 'feedback-input', 'feedback-motion', 'copy-button-feedback', 'chip-toast-tokens', 'component-motion', 'native-layout'), ...layers, ...contracts],
  modal: [...layers, ...files('quantity', 'feedback-dialog', 'feedback-input', 'form-actions', 'component-motion'), ...contracts],
  drawer: [...layers, ...files('component-motion', 'size-contracts', 'native-layout')],
  popover: [...layers, ...files('popover-design', 'expanded', 'react-popover-trigger')],
  dropdown: [...layers, ...files('dropdown-design', 'menu-button', 'controlled-state', 'expanded')],
  tooltip: [...layers, ...files('expanded', 'size-contracts', 'accessibility-controls', 'refresh-button', 'menu-button', 'tooltip-lifecycle')],
  icons: [...files('icon-render', 'icon-registry', 'icon-toggle', 'menu-button', 'button-design'), ...contracts, ...visuals],
  typography: files('typography', 'layout-primitives', 'color-font', 'geometry-tokens', 'card-layout'),
  i18n: files('i18n'),
  additions: files('additions'),
  adoption: files('adoption'),
  requests: files('requests'),
  rounded: files('rounded'),
  surfaces: files('surfaces'),
  parity: files('parity'),
  primitives: [...files('layout-primitives', 'typography', 'geometry-tokens', 'card-layout', 'input-design'), ...visuals],
  kpi: [...files('kpi-secondary', 'loading-options', 'typography', 'geometry-tokens', 'card-layout'), ...visuals],
  quantity: [...files('quantity', 'elevation-inputs', 'interaction-states'), ...fields, ...visuals],
  slider: files('slider-design', 'react-slider-format'),
  checkbox: [...files('react-checkbox-mixed', 'accessibility-controls', 'input-contracts', 'controlled-state', 'interaction-states', 'visual-choice-contracts', 'token-choice-propagation')],
  progress: files('adoption-values', 'adoption', 'size-contracts', 'token-display-propagation'),
  'time-picker': [...files('elevation-inputs'), ...fields, ...visuals],
  radio: [...files('radio-design', 'expanded'), ...fields, ...visuals],
  accessibility: files('accessibility-tabs', 'accessibility-components', 'accessibility-controls', 'elevation-keyboard', 'input-contracts'),
};
for (const scope of ['select', 'popover', 'tooltip', 'button']) componentGroups[scope].push(...files('adoption-attrs'));
componentGroups.dropdown.push(...files('adoption-menu'));
componentGroups.kpi.push(...files('adoption-values'));
componentGroups.tabs.push(...files('adoption-tabs'));
componentGroups.table.push(...files('adoption-table'));
// Add only the split contracts that exercise this scope. Shared runtime/token changes still run full.
export const relatedGroups = Object.fromEntries(Object.entries(componentGroups).map(([scope, specs]) => [
  scope, [...new Set([...specs, ...contractsForScope(scope)])],
]));
export const fullScopes = ['all', 'tokens', 'runtime', 'layers', 'layout', 'motion'];
// 패치 검사는 범위 전용 파일만 남긴다. 여러 범위가 함께 쓰는 시각·계약·입력·레이어 묶음은 기능 릴리스의 related 검사에 맡긴다.
const sharedFiles = new Set([...contracts, ...fields, ...visuals, ...layers, ...contractFiles]);

export function planBrowserTests(argv) {
  const args = [...argv];
  let profile = 'full';
  if (args[0] === '--profile') {
    args.shift();
    profile = args.shift();
  }
  if (!['full', 'smoke', 'related', 'patch'].includes(profile)) throw Error(`알 수 없는 검사 모드: ${profile}`);
  let selected = [], description = '전체 패키지 검사';
  if (profile === 'smoke') {
    selected = smokeFiles;
    description = '세 플랫폼의 기본 선택·카드·데이터 상태 빠른 검사';
  }
  if (profile === 'related' || profile === 'patch') {
    const scopes = (args.shift() || '').split(',').map(scope => scope.trim());
    if (scopes.some(scope => !Object.hasOwn(relatedGroups, scope) && !fullScopes.includes(scope))) {
      throw Error(`관련 검사 범위를 지정하세요: ${[...Object.keys(relatedGroups), ...fullScopes].join(', ')}. 여러 범위는 쉼표로 연결합니다.`);
    }
    if (profile === 'patch') {
      if (scopes.some(scope => fullScopes.includes(scope))) {
        throw Error(`공통 변경(${scopes.join(', ')})은 패치 검사로 줄일 수 없습니다. test:browser:related 또는 test:browser:full을 사용하세요.`);
      }
      selected = [...new Set([...scopes.flatMap(scope => relatedGroups[scope]).filter(file => !sharedFiles.has(file)), ...smokeFiles])];
      description = `패치 검사(범위 전용 파일 + smoke, 부분 검증): ${scopes.join(', ')}`;
    } else if (scopes.some(scope => fullScopes.includes(scope))) {
      profile = 'full';
      description = `공통 변경(${scopes.join(', ')}) → 전체 패키지 검사`;
    } else {
      selected = [...new Set(scopes.flatMap(scope => relatedGroups[scope]))];
      description = `관련 패키지 검사: ${scopes.join(', ')}`;
    }
  }
  if (args[0] === '--') args.shift();
  if (args.some(arg => /^(-c|--config(?:=|$))/.test(arg))) {
    throw Error('검사 범위의 설정은 고정입니다. 별도 브라우저 설정은 npm run test:browser -- -c <config>를 사용하세요.');
  }
  return { profile, description, args: ['test', '-c', 'playwright.config.ts', ...selected, ...args] };
}
