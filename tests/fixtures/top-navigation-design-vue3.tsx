import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { setupTopNavigationColors, topNavigationConfig } from './top-navigation-design-data';
setupTopNavigationColors();
const s = reactive({ config: { ...topNavigationConfig } as any, events: [] as string[] });
Object.assign(window, { configureTopNavigation: (next: object) => { s.config = { ...s.config, ...next }; s.events = []; } });
const push = (name: string) => () => s.events.push(name);
createApp(defineComponent(() => () => {
  const config = s.config;
  const actions = config.actions ? config.mixed ? <>
    <K.KjunRefreshButton disabled={config.disabled} loading={config.loading} onRefresh={push('refresh')} />
    <K.KjunMenuButton compact variant="ghost" ariaLabel="더 보기" disabled={config.disabled} loading={config.loading}><K.KjunDropdownItem onClick={push('menu')}>세부 정보</K.KjunDropdownItem></K.KjunMenuButton>
    <K.KjunIconToggle activeIcon="heart" ariaLabel="즐겨찾기" active={config.active} disabled={config.disabled} loading={config.loading}
      onToggle={() => { s.config = { ...s.config, active: !s.config.active }; s.events.push('toggle'); }} />
  </> : <>
    <K.KjunButton variant={config.variant} size="sm" disabled={config.disabled} loading={config.loading} onClick={push('save')}>{config.actionText}</K.KjunButton>
    {config.multiple && <K.KjunButton variant="ghost" size="sm" onClick={push('cancel')}>취소</K.KjunButton>}
  </> : undefined;
  return <K.KjunProvider><main style={{ padding: '16px' }}>
    <div data-testid="header"><K.KjunTopNavigation title={config.title} description={config.description} safeAreaTop={config.safeAreaTop}>
      {{
        ...(config.leading ? { leading: () => <K.KjunButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel={config.leadingText || '뒤로 가기'} disabled={config.disabled}
          onClick={push('back')}>{config.leadingText || undefined}</K.KjunButton> } : {}),
        ...(actions ? { actions: () => actions } : {}),
      }}
    </K.KjunTopNavigation></div>
    <div data-testid="outside"><K.KjunButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel="일반 버튼" /><K.KjunIconToggle activeIcon="heart" ariaLabel="일반 즐겨찾기" /></div>
    <output data-testid="events">{s.events.join('|')}</output>
  </main></K.KjunProvider>;
})).mount('#root');
