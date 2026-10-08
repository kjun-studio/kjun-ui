import { useState } from 'react';
import { Pressable } from 'react-native';
import { columns, initial, rows } from './icon-toggle-values';

export function ToggleCases({ K, native = false }: { K: any; native?: boolean }) {
  const [config, setConfig] = useState(initial), [events, setEvents] = useState<unknown[]>([]);
  const emit = (event: string, id?: number | string) => setEvents(old => [...old, [event, id ?? null]]);
  Object.assign(window, {
    configureToggle: (next: Partial<typeof initial>) => setConfig(old => ({ ...old, ...next })),
    resetToggleEvents: () => setEvents([]), toggleExports: Object.keys(K),
  });
  const toggle = <K.DsIconToggle active={config.active} activeIcon={config.activeIcon}
    inactiveIcon={config.inactiveIcon} ariaLabel={'예제 항목 관심 ' + (config.active ? '해제' : '등록')}
    loading={config.loading} disabled={config.disabled} size={config.size}
    onToggle={() => emit('toggle')} />;
  return <>
    {native ? <Pressable onPress={() => emit('parent')}>{toggle}</Pressable>
      : <div onClick={() => emit('parent')}>{toggle}</div>}
    <K.DsMarketTable rows={rows} columns={columns} hasLoadedOnce showActions
      primaryLabel={(row: typeof rows[number]) => row.id === 0 ? '사용자 이름' : ''}
      favoriteKeys={new Set(config.favorite)} interestKeys={new Set(config.interest)}
      togglingFavorite={config.togglingFavorite} togglingInterest={config.togglingInterest}
      onToggleFavorite={(row: typeof rows[number]) => emit('favorite', row.id)}
      onToggleInterest={(row: typeof rows[number]) => emit('interest', row.id)}
      onRowClick={(row: typeof rows[number]) => emit('row', row.id)} />
    <button>다음 컨트롤</button>
    <output data-testid="events">{JSON.stringify(events)}</output>
  </>;
}
