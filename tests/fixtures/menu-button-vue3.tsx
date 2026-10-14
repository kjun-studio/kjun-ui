import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { applyDemoColors, menuConfig, menuChoices, fixtureStyle } from './menu-button-cases';
applyDemoColors('default');
const state = reactive({ config: { ...menuConfig } as any, events: [] as string[] });
Object.assign(window, { configureMenu: (next: object) => { state.config = { ...state.config, ...next }; } });
createApp(defineComponent(() => () => {
  const c = state.config, iconOnly = c.compact || !c.label;
  return <K.KjunProvider>{{ default: () => (
    <div style={fixtureStyle}>
      <div data-testid="menu"><K.KjunMenuButton {...c} onOpen={() => state.events.push('open')} onClose={() => state.events.push('close')}>{{ default: () => [
        <K.KjunDropdownItem icon="edit" onClick={() => state.events.push('action')}>수정하기</K.KjunDropdownItem>,
        <K.KjunDropdownItem disabled>비활성 항목</K.KjunDropdownItem>,
        <K.KjunDropdownItem icon="copy">복제하기</K.KjunDropdownItem>,
      ] }}</K.KjunMenuButton></div>
      <div data-testid="reference"><K.KjunButton size={c.size} variant={c.variant || 'secondary'} loading={c.loading} disabled={c.disabled}
        prefixIcon={iconOnly ? 'dots-vertical' : undefined} suffixIcon={iconOnly ? undefined : 'chevron-down'}>{{ default: () => iconOnly ? undefined : c.label }}</K.KjunButton></div>
      <div data-testid="group"><K.KjunButtonGroup size={c.size} modelValue="week" options={menuChoices} ariaLabel="조회 기간" /></div>
      <button data-testid="outside">바깥 버튼</button>
      <output data-testid="events">{state.events.join(',')}</output>
      <output data-testid="config" hidden>{JSON.stringify(c)}</output>
    </div>
  ) }}</K.KjunProvider>;
})).mount('#root');
