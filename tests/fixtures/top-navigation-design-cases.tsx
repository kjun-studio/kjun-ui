import { useLayoutEffect, useState } from 'react';
import { topNavigationConfig } from './top-navigation-design-data';
export function TopNavigationDesignCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(topNavigationConfig), [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureTopNavigation: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  const action = (name: string) => ({ [native ? 'onPress' : 'onClick']: () => setEvents(old => [...old, name]) });
  return <main style={{ padding: 16 }}>
    <div data-testid="header"><K.DsTopNavigation title={config.title} description={config.description} safeAreaTop={config.safeAreaTop}
      leading={config.leading ? <K.DsButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel={config.leadingText || '뒤로 가기'} disabled={config.disabled} {...action('back')}>{config.leadingText || undefined}</K.DsButton> : undefined}
      actions={config.actions ? config.mixed ? <>
        <K.DsRefreshButton disabled={config.disabled} loading={config.loading} onRefresh={() => setEvents(old => [...old, 'refresh'])} />
        <K.DsMenuButton compact variant="ghost" ariaLabel="더 보기" disabled={config.disabled} loading={config.loading}><K.DsDropdownItem {...action('menu')}>세부 정보</K.DsDropdownItem></K.DsMenuButton>
        <K.DsIconToggle activeIcon="heart" ariaLabel="즐겨찾기" active={config.active} disabled={config.disabled} loading={config.loading} onToggle={() => { setConfig(old => ({ ...old, active: !old.active })); setEvents(old => [...old, 'toggle']); }} />
      </> : <><K.DsButton variant={config.variant} size="sm" disabled={config.disabled} loading={config.loading} {...action('save')}>{config.actionText}</K.DsButton>{config.multiple && <K.DsButton variant="ghost" size="sm" {...action('cancel')}>취소</K.DsButton>}</> : undefined} /></div>
    <div data-testid="outside"><K.DsButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel="일반 버튼" /><K.DsIconToggle activeIcon="heart" ariaLabel="일반 즐겨찾기" /></div>
    <output data-testid="events">{events.join('|')}</output>
  </main>;
}
