// Each entry selects the whole spec, including every platform and viewport case.
// Mixed-component contracts belong to every component they exercise.
export const contractScopes = {
  'visual-compound-contracts': ['quantity', 'time-picker', 'input', 'select'],
  'visual-composition-contracts': ['card', 'quantity', 'time-picker', 'navigation', 'button', 'popover', 'data-state', 'market', 'select', 'combobox', 'input', 'form', 'primitives'],
  'visual-navigation-contracts': ['tabs', 'navigation'],
  'visual-chart-contracts': ['market', 'data-state'],
  'visual-choice-contracts': ['radio', 'select', 'combobox', 'popover', 'dropdown'],
  'visual-button-contracts': ['button'],
  'visual-table-contracts': ['table', 'select'],
  'visual-state-contracts': ['data-state', 'alert', 'accessibility'],
  'visual-popover-contracts': ['popover', 'dropdown', 'tooltip', 'accessibility'],
  'visual-tooltip-contracts': ['tooltip', 'accessibility'],
  'visual-field-contracts': ['input', 'form', 'select', 'combobox', 'search-input', 'time-picker', 'quantity', 'radio', 'accessibility'],
  'visual-market-contracts': ['market', 'table'],
  'token-table-propagation': ['table', 'button', 'input', 'data-state', 'alert', 'kpi'],
  'token-form-propagation': ['form', 'input', 'button', 'radio', 'market', 'table', 'quantity', 'select', 'combobox'],
  'token-typography-propagation': ['data-state', 'button', 'tabs'],
  'token-choice-propagation': ['radio', 'input', 'form', 'accessibility'],
  'token-display-propagation': ['alert', 'data-state', 'modal', 'button', 'icons'],
  'token-layer-propagation': ['modal', 'drawer', 'tooltip', 'popover', 'dropdown', 'feedback'],
  'token-market-propagation': ['market', 'table'],
  'token-responsive-propagation': ['kpi', 'form', 'input'],
};

export const contractFiles = Object.keys(contractScopes).map(name => `tests/browser/${name}.spec.ts`);
export const tokenPropagationFiles = contractFiles.filter(path => path.includes('/token-'));

export function contractsForScope(scope) {
  return Object.entries(contractScopes)
    .filter(([, scopes]) => scopes.includes(scope) || scope === 'typography')
    .map(([name]) => `tests/browser/${name}.spec.ts`);
}
