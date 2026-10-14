import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { dropdownConfig, menuLabel, setDropdownColors } from './dropdown-design-cases';
setDropdownColors();
const state = reactive({ config: { ...dropdownConfig } as any, selected: 'first', events: 0 });
Object.assign(window, { configureDropdown: (next: object) => { state.config = { ...state.config, ...next }; setDropdownColors(state.config.dark); } });
const item = (label: string, value: string, props: Record<string, unknown>) =>
  <K.KjunDropdownItem {...props} onClick={() => { state.selected = value; state.events++; }}>{label}</K.KjunDropdownItem>;
const items = () => [
  item(menuLabel(state.config.long), 'first', { selected: state.selected === 'first', icon: 'check' }),
  item('둘째 항목', 'second', { selected: state.selected === 'second', icon: state.config.mixed ? undefined : 'copy' }),
  <K.KjunDropdownDivider />,
  item('비활성 항목', 'disabled', { disabled: true, icon: 'lock' }),
  item('삭제', 'delete', { variant: 'danger', icon: 'trash' }),
];
createApp(defineComponent(() => () => (
  <K.KjunProvider>{{ default: () => (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
      <div data-testid="plain"><K.KjunDropdown disabled={state.config.disabled}>{{
        trigger: () => <K.KjunButton variant="secondary" suffixIcon="chevron-down">기본 메뉴</K.KjunButton>,
        default: items,
      }}</K.KjunDropdown></div>
      <div data-testid="menu-button"><K.KjunMenuButton label="작업 메뉴" disabled={state.config.disabled} loading={state.config.loading}>{{ default: items }}</K.KjunMenuButton></div>
      <div data-testid="button"><K.KjunButton variant="secondary">일반 버튼</K.KjunButton></div>
      <K.KjunButtonGroup modelValue="first" options={[{ value: 'first', label: '첫 항목' }, { value: 'second', label: '둘째 항목' }]} />
      <output data-testid="events">{String(state.events)}</output>
    </div>
  ) }}</K.KjunProvider>
))).mount('#root');
