import { createApp, defineComponent, reactive } from 'vue';
import * as K from '@kjun-ui/vue3';
import accessible from '@kjun-ui/icons/icons/accessible';
import alien from '@kjun-ui/icons/icons/alien';
import rocket from '@kjun-ui/icons/icons/rocket';
import { setup } from './icon-toggle-values';
setup();
const state = reactive({ changed: false, removed: false, modal: false, drawer: false });
Object.assign(window, { updateIcons: (change: boolean, remove = false) => { state.changed = change; state.removed = remove; } });
const Feedback = defineComponent(() => {
  const feedback = K.useKjunFeedback();
  return () => <button onClick={() => feedback.toast.info('등록된 피드백 아이콘', { duration: 0 })}>피드백 표시</button>;
});
const icon = (id: string, name: string, filled = false) => <div data-testid={id}><K.KjunIcon name={name} size={24} filled={filled} /></div>;
createApp(defineComponent(() => () => {
  const registration = state.removed ? {} : { accessible, alien: state.changed ? rocket : alien, custom: alien, heart: alien, x: alien, 'info-circle': alien };
  return <div>
    <K.KjunProvider icons={registration}><K.KjunFeedbackProvider>
      <div data-testid="colored-node"><K.KjunIcon name="accessible" size={24} color="#b61dd8" /></div>{icon('extra', 'alien')}{icon('extra-filled', 'alien', true)}{icon('unknown', 'missing')}{icon('fallback', 'search', true)}
      <div data-testid="prefix"><K.KjunButton prefixIcon="alien">내부 아이콘</K.KjunButton></div>
      <K.KjunProvider icons={{ custom: { outline: rocket.outline } }}>
        {icon('nested-outline', 'custom')}{icon('nested-filled', 'custom', true)}{icon('nested-inherit', 'alien')}
      </K.KjunProvider>
      <button onClick={() => { state.modal = true; }}>모달 표시</button><button onClick={() => { state.drawer = true; }}>드로어 표시</button><Feedback />
      <K.KjunModal open={state.modal} title="아이콘 모달" onUpdate:open={(open: boolean) => { state.modal = open; }}>{icon('modal-icon', 'alien')}</K.KjunModal>
      <K.KjunDrawer open={state.drawer} title="아이콘 드로어" onUpdate:open={(open: boolean) => { state.drawer = open; }}>{icon('drawer-icon', 'alien')}</K.KjunDrawer>
    </K.KjunFeedbackProvider></K.KjunProvider>
    <K.KjunProvider>{icon('isolated', 'alien')}{icon('default-heart', 'heart', true)}</K.KjunProvider>
  </div>;
})).mount('#root');
