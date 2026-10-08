const files = (...names) => names.map(name => `tests/browser/${name}.spec.ts`);
export const smokeFiles = files('expanded', 'card-contract', 'data-state-design');
const contracts = files('api-reference', 'vue-contracts');
const fields = files('input-contracts', 'controlled-state', 'live-updates', 'accessibility-controls');
const visuals = files('visual-contract', 'size-contracts', 'token-propagation');
const layers = files('elevation', 'elevation-edges', 'elevation-inputs', 'elevation-keyboard',
  'elevation-order', 'elevation-reopen', 'elevation-retention', 'provider-layers',
  'layer-contracts', 'layer-motion-edges', 'popup-escape', 'styles');

// 제목 필터 대신 파일 전체를 선택해 플랫폼별 사례와 함께 쓰이는 컴포넌트를 보존한다.
export const relatedGroups = {
  alert: [...files('alert-design', 'accessibility-components', 'chip-toast-tokens'), ...visuals],
  'data-state': [...files('data-state-design', 'table-contracts', 'runtime-cards', 'runtime-market'), ...contracts],
  card: [...files('card-contract', 'card-review', 'card-layout', 'card-colors', 'card-hairline', 'geometry-tokens'), ...visuals],
  table: [...files('table-contracts', 'runtime-cards', 'data-state-design', 'accessibility-components'), ...contracts, ...visuals],
  market: [...files('runtime-market', 'data-state-design', 'geometry-tokens'), ...visuals],
  select: [...files('select-scroll', 'expanded', 'elevation-inputs', 'popup-escape'), ...fields, ...contracts, ...visuals],
  combobox: [...files('select-scroll', 'popup-escape', 'elevation-inputs'), ...fields, ...contracts, ...visuals],
  'search-input': [...files('search-input', 'elevation-inputs'), ...fields, ...contracts],
  input: [...files('input-design', 'interaction-states', 'search-input', 'quantity', 'feedback-input', 'elevation-inputs'), ...fields, ...contracts, ...visuals],
  button: [...files('button-design', 'interaction-states', 'button-group-motion', 'form-actions', 'bottom-action-bar-design', 'menu-button', 'refresh-button', 'copy-button-feedback', 'icon-toggle', 'accessibility-components'), ...visuals],
  form: [...files('form-actions', 'input-design', 'interaction-states', 'feedback-input', 'quantity', 'bottom-action-bar-design'), ...fields, ...contracts],
  tabs: [...files('tabs-contract', 'tabs-design', 'accessibility-tabs', 'controlled-state', 'live-updates', 'component-motion', 'expanded'), ...visuals],
  accordion: [...files('accordion-design', 'controlled-state', 'component-motion', 'expanded', 'accessibility-components'), ...visuals],
  navigation: [...files('top-navigation-design', 'bottom-navigation-design', 'bottom-action-bar-design', 'accessibility-components'), ...visuals],
  feedback: [...files('feedback-dialog', 'feedback-input', 'feedback-motion', 'copy-button-feedback', 'chip-toast-tokens', 'component-motion'), ...layers, ...contracts],
  modal: [...layers, ...files('quantity', 'feedback-dialog', 'feedback-input', 'form-actions', 'component-motion'), ...contracts],
  drawer: [...layers, ...files('component-motion', 'size-contracts')],
  popover: [...layers, ...files('popover-design', 'expanded')],
  dropdown: [...layers, ...files('dropdown-design', 'menu-button', 'controlled-state', 'expanded')],
  tooltip: [...layers, ...files('expanded', 'size-contracts')],
  icons: [...files('icon-render', 'icon-registry', 'icon-toggle', 'menu-button', 'button-design'), ...contracts, ...visuals],
  typography: files('typography', 'color-font', 'geometry-tokens', 'card-layout', 'visual-contract'),
  quantity: [...files('quantity', 'elevation-inputs', 'interaction-states'), ...fields, ...visuals],
  slider: [...files('slider-design'), ...fields, ...visuals],
  'time-picker': [...files('elevation-inputs'), ...fields, ...visuals],
  radio: [...files('radio-design', 'expanded'), ...fields, ...visuals],
  accessibility: files('accessibility-tabs', 'accessibility-components', 'accessibility-controls', 'elevation-keyboard', 'input-contracts'),
};
export const fullScopes = ['all', 'tokens', 'runtime', 'layers', 'layout', 'motion'];

export function planBrowserTests(argv) {
  const args = [...argv];
  let profile = 'full';
  if (args[0] === '--profile') {
    args.shift();
    profile = args.shift();
  }
  if (!['full', 'smoke', 'related'].includes(profile)) throw Error(`알 수 없는 검사 모드: ${profile}`);
  let selected = [], description = '전체 패키지 검사';
  if (profile === 'smoke') {
    selected = smokeFiles;
    description = '세 플랫폼의 기본 선택·카드·데이터 상태 빠른 검사';
  }
  if (profile === 'related') {
    const scopes = (args.shift() || '').split(',').map(scope => scope.trim());
    if (scopes.some(scope => !Object.hasOwn(relatedGroups, scope) && !fullScopes.includes(scope))) {
      throw Error(`관련 검사 범위를 지정하세요: ${[...Object.keys(relatedGroups), ...fullScopes].join(', ')}. 여러 범위는 쉼표로 연결합니다.`);
    }
    if (scopes.some(scope => fullScopes.includes(scope))) {
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
