import { useLayoutEffect, useState } from 'react';
import { topNavigationConfig } from './top-navigation-design-data';
export function TopNavigationDesignCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(topNavigationConfig), [events, setEvents] = useState<string[]>([]);
  useLayoutEffect(() => { Object.assign(window, { configureTopNavigation: (next: object) => { setConfig(old => ({ ...old, ...next })); setEvents([]); } }); }, []);
  const action = (name: string) => ({ [native ? 'onPress' : 'onClick']: () => setEvents(old => [...old, name]) });
  return <main style={{ padding: 16 }}>
    <div data-testid="header"><K.KjunTopNavigation title={config.title} description={config.description} safeAreaTop={config.safeAreaTop}
      leading={config.leading ? <K.KjunButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel={config.leadingText || '뒤로 가기'} disabled={config.disabled} {...action('back')}>{config.leadingText || undefined}</K.KjunButton> : undefined}
      actions={config.actions ? config.mixed ? <>
        <K.KjunRefreshButton disabled={config.disabled} loading={config.loading} onRefresh={() => setEvents(old => [...old, 'refresh'])} />
        <K.KjunMenuButton compact variant="ghost" ariaLabel="더 보기" disabled={config.disabled} loading={config.loading}><K.KjunDropdownItem {...action('menu')}>세부 정보</K.KjunDropdownItem></K.KjunMenuButton>
        <K.KjunIconToggle activeIcon="heart" ariaLabel="즐겨찾기" active={config.active} disabled={config.disabled} loading={config.loading} onToggle={() => { setConfig(old => ({ ...old, active: !old.active })); setEvents(old => [...old, 'toggle']); }} />
      </> : <><K.KjunButton variant={config.variant} size="sm" disabled={config.disabled} loading={config.loading} {...action('save')}>{config.actionText}</K.KjunButton>{config.multiple && <K.KjunButton variant="ghost" size="sm" {...action('cancel')}>취소</K.KjunButton>}</> : undefined} /></div>
    <div data-testid="outside"><K.KjunButton variant="ghost" size="sm" prefixIcon="arrow-left" ariaLabel="일반 버튼" /><K.KjunIconToggle activeIcon="heart" ariaLabel="일반 즐겨찾기" /></div>
    <output data-testid="events">{events.join('|')}</output>
  </main>;
}
