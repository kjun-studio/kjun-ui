import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import { columns, initial, rows, setup } from './icon-toggle-values';
setup();
const s = reactive({ config: { ...initial }, events: [] as unknown[] });
const emit = (event: string, id?: number | string) => s.events.push([event, id ?? null]);
Object.assign(window, {
  configureToggle: (next: Partial<typeof initial>) => { s.config = { ...s.config, ...next }; },
  resetToggleEvents: () => { s.events = []; }, toggleExports: Object.keys(K),
});
createApp(defineComponent(() => () => {
  const config = s.config;
  return <K.KjunProvider>
    <div onClick={() => emit('parent')}>
      <K.KjunIconToggle active={config.active} activeIcon={config.activeIcon} inactiveIcon={config.inactiveIcon}
        ariaLabel={'예제 항목 관심 ' + (config.active ? '해제' : '등록')} loading={config.loading} disabled={config.disabled} size={config.size as any}
        onToggle={() => emit('toggle')} />
    </div>
    <K.KjunMarketTable rows={rows} columns={columns} hasLoadedOnce showActions
      primaryLabel={(row: typeof rows[number]) => row.id === 0 ? '사용자 이름' : ''}
      favoriteKeys={new Set(config.favorite)} interestKeys={new Set(config.interest)}
      togglingFavorite={config.togglingFavorite} togglingInterest={config.togglingInterest}
      onToggle-favorite={(row: typeof rows[number]) => emit('favorite', row.id)}
      onToggle-interest={(row: typeof rows[number]) => emit('interest', row.id)}
      onRowClick={(row: typeof rows[number]) => emit('row', row.id)} />
    <button>다음 컨트롤</button>
    <output data-testid="events">{JSON.stringify(s.events)}</output>
  </K.KjunProvider>;
})).mount('#root');
